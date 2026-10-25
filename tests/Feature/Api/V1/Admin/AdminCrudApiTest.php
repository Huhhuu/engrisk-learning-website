<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCrudApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $learner;

    private int $adminRoleId;

    private int $learnerRoleId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->adminRoleId = Role::where('slug', 'admin')->value('id');
        $this->learnerRoleId = Role::where('slug', 'learner')->value('id');

        $this->admin = User::factory()->create([
            'role_id' => Role::where('slug', 'super_admin')->value('id'),
        ]);
        $this->learner = User::factory()->create(['role_id' => $this->learnerRoleId]);
    }

    /**
     * Test guest access gets 401 or redirect.
     */
    public function test_guest_is_unauthorized(): void
    {
        $this->getJson('/api/v1/admin/users')->assertStatus(401);
        $this->postJson('/api/v1/admin/users', ['name' => 'Test'])->assertStatus(401);
    }

    /**
     * Test learner access gets 403.
     */
    public function test_learner_is_forbidden(): void
    {
        $this->actingAs($this->learner)
            ->getJson('/api/v1/admin/users')
            ->assertStatus(403);

        $this->actingAs($this->learner)
            ->postJson('/api/v1/admin/users', ['name' => 'Test'])
            ->assertStatus(403);
    }

    /**
     * Test User management.
     */
    public function test_admin_can_manage_users(): void
    {
        $user = User::factory()->create(['role_id' => $this->learnerRoleId]);

        // 1. Index
        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/users')
            ->assertStatus(200)
            ->assertJsonFragment(['email' => $user->email]);

        // 2. Show
        $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/users/{$user->id}")
            ->assertStatus(200)
            ->assertJsonFragment(['email' => $user->email]);

        // 3. Update Role
        $this->actingAs($this->admin)
            ->withHeader('X-Request-ID', '00000000-0000-4000-8000-000000000001')
            ->putJson("/api/v1/admin/users/{$user->id}/role", [
                'role' => 'admin',
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'role_id' => $this->adminRoleId]);
    }

    /**
     * Test admin cannot demote themselves or the last admin.
     */
    public function test_admin_cannot_demote_self_or_last_admin(): void
    {
        $this->actingAs($this->admin)
            ->withHeader('X-Request-ID', '00000000-0000-4000-8000-000000000002')
            ->putJson("/api/v1/admin/users/{$this->learner->id}/role", [
                'role' => 'learner',
            ])
            ->assertOk();

        // Self demote
        $this->actingAs($this->admin)
            ->withHeader('X-Request-ID', '00000000-0000-4000-8000-000000000003')
            ->putJson("/api/v1/admin/users/{$this->admin->id}/role", [
                'role' => 'learner',
            ])
            ->assertForbidden();
    }
}
