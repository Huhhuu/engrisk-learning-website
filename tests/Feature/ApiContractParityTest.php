<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ApiContractParityTest extends TestCase
{
    private const SPEC = 'docs/openapi/laravel-v1.yaml';

    private const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

    public function test_documented_and_registered_api_v1_operations_match(): void
    {
        $runtime = $this->runtimeOperations();
        $documented = $this->documentedOperations();

        $undocumented = array_values(array_diff($runtime, $documented));
        $phantom = array_values(array_diff($documented, $runtime));

        $this->assertSame([], $undocumented, 'Registered operations missing from '.self::SPEC.":\n".implode("\n", $undocumented));
        $this->assertSame([], $phantom, 'Documented operations with no registered route:\n'.implode("\n", $phantom));
    }

    /** @return list<string> sorted "METHOD /path" operations, parameter names normalized */
    private function runtimeOperations(): array
    {
        $operations = [];
        foreach (Route::getRoutes() as $route) {
            if (! str_starts_with($route->uri(), 'api/v1/')) {
                continue;
            }
            foreach (array_diff($route->methods(), ['HEAD', 'OPTIONS']) as $method) {
                $operations[] = $method.' '.$this->normalize('/'.$route->uri());
            }
        }

        return $this->sorted($operations);
    }

    /**
     * Reads `paths:` keys and their standard method children without a YAML
     * dependency: path keys sit at two spaces, methods at four.
     *
     * @return list<string>
     */
    private function documentedOperations(): array
    {
        $lines = file(base_path(self::SPEC), FILE_IGNORE_NEW_LINES);
        $this->assertNotFalse($lines, 'Could not read '.self::SPEC);

        $operations = [];
        $inPaths = false;
        $path = null;
        foreach ($lines as $line) {
            if (preg_match('/^\S/', $line)) {
                $inPaths = str_starts_with($line, 'paths:');
                $path = null;

                continue;
            }
            if (! $inPaths) {
                continue;
            }
            if (preg_match('#^ {2}(/\S*):\s*$#', $line, $match)) {
                $path = $this->normalize($match[1]);

                continue;
            }
            if ($path !== null && preg_match('/^ {4}([a-z]+):\s*$/', $line, $match)
                && in_array($match[1], self::METHODS, true)) {
                $operations[] = strtoupper($match[1]).' '.$path;
            }
        }

        return $this->sorted($operations);
    }

    private function normalize(string $path): string
    {
        return preg_replace('/\{[^}]+\}/', '{param}', rtrim($path, '/')) ?? $path;
    }

    /** @return list<string> */
    private function sorted(array $operations): array
    {
        $operations = array_values(array_unique($operations));
        sort($operations);

        return $operations;
    }
}
