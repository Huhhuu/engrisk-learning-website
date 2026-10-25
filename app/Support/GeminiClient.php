<?php

namespace App\Support;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class GeminiClient
{
    /**
     * Ask Gemini for a JSON answer matching $schema and return it decoded.
     * Throws ConnectionException/RequestException on transport failures.
     */
    public function json(string $prompt, array $schema): array
    {
        $key = config('services.gemini.api_key');
        if (! is_string($key) || $key === '') {
            throw new RuntimeException('Gemini api_key is not configured.');
        }
        $model = rawurlencode((string) config('services.gemini.model', 'gemini-3.5-flash'));

        $response = Http::baseUrl('https://generativelanguage.googleapis.com/v1beta')
            ->withHeader('x-goog-api-key', $key)
            ->acceptJson()
            ->connectTimeout(5)
            ->timeout(30)
            ->retry(2, 200, fn (Throwable $exception) => $exception instanceof ConnectionException
                || ($exception instanceof RequestException && $exception->response->serverError()))
            ->post("/models/{$model}:generateContent", [
                'contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'responseJsonSchema' => $schema,
                ],
            ]);

        $decoded = json_decode((string) data_get($response->json(), 'candidates.0.content.parts.0.text', ''), true);
        if (! is_array($decoded)) {
            throw new RuntimeException('Gemini returned no JSON answer.');
        }

        return $decoded;
    }
}
