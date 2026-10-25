<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class GoogleAdminMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_authenticated_admin_without_google_marker_is_rejected_and_demoted(): void
    {
        $this->seed();
        $user = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'admin')->value('id'),
            'email' => 'admin@example.com',
        ]);
        config()->set('admin_access.admin_emails', ['admin@example.com']);
        config()->set('admin_access.super_admin_emails', []);

        Auth::login($user);
        $this->getJson('/api/v1/admin/users')->assertUnauthorized();

        $this->assertSame('learner', $user->fresh()->role->slug);
        $this->assertGuest();
    }

    public function test_password_logged_in_admin_cannot_reach_removed_admin_routes(): void
    {
        $this->seed();
        $admin = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'admin')->value('id'),
            'password' => 'admin-password',
        ]);
        $superAdmin = User::factory()->create(['role_id' => Role::query()->where('slug', 'super_admin')->value('id')]);

        $this->postJson('/api/v1/auth/login', ['email' => $admin->email, 'password' => 'admin-password'])->assertOk();
        $this->putJson("/api/admin/users/{$superAdmin->id}/role", ['role' => 'USER'])->assertNotFound();
        $this->postJson("/api/admin/users/{$superAdmin->id}/reset-password")->assertNotFound();
        $this->postJson('/api/v1/admin/topics', ['name' => 'Spam'])->assertNotFound();
        $this->postJson('/api/v1/admin/media/upload')->assertNotFound();

        $this->assertSame('super_admin', $superAdmin->fresh()->role->slug);
    }

    public function test_marker_is_rechecked_and_role_is_synchronized_on_every_request(): void
    {
        $this->seed();
        $user = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'admin')->value('id'),
            'email' => 'owner@example.com',
            'google_id' => 'google-owner',
            'auth_provider' => 'google',
        ]);
        config()->set('admin_access.admin_emails', []);
        config()->set('admin_access.super_admin_emails', ['owner@example.com']);

        Auth::login($user);
        $this->withSession(['google_admin' => [
            'user_id' => $user->id,
            'subject' => 'google-owner',
            'email' => 'owner@example.com',
        ]])->getJson('/api/v1/admin/users')->assertOk();

        $this->assertSame('super_admin', $user->fresh()->role->slug);
    }
}
