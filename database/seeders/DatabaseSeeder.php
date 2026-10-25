<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(CatalogSeeder::class);
        $this->call(LessonQuizSeeder::class);
        $this->call(ProductionContentSeeder::class);
        // Demo accounts (password123) are local-only: php artisan db:seed --class=TestUserSeeder
    }
}
