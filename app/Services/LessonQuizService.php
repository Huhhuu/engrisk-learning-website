<?php

namespace App\Services;

use App\Exceptions\LessonQuizException;
use App\Models\Answer;
use App\Models\Assignment;
use App\Models\Attempt;
use App\Models\AttemptAnswer;
use App\Models\Enrollment;
use App\Models\Progress;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class LessonQuizService
{
    public function __construct(private readonly CourseLearningPath $paths) {}

    public function eligibleForLesson(User $user, int $lessonId, int $courseId): bool
    {
        return Enrollment::query()->where('user_id', $user->id)->where('course_id', $courseId)
            ->whereIn('status', ['active', 'completed'])->exists()
            || Assignment::query()->where('learner_id', $user->id)->where('lesson_id', $lessonId)
                ->whereIn('status', ['pending', 'in_progress', 'completed'])->exists();
    }

    /** @return array{0: Attempt, 1: bool} */
    public function start(User $user, Quiz $quiz): array
    {
        try {
            return DB::transaction(function () use ($user, $quiz): array {
                $lockedQuiz = Quiz::query()->with(['lesson.course', 'questions.answers'])->lockForUpdate()->findOrFail($quiz->id);
                $this->assertAvailable($user, $lockedQuiz);
                if ($lockedQuiz->questions->isEmpty()) {
                    throw new LessonQuizException('QUIZ_EMPTY', 409, 'This quiz has no questions.');
                }
                $attempt = Attempt::query()->where('user_id', $user->id)->where('active_quiz_id', $lockedQuiz->id)->first();
                if ($attempt) {
                    return [$this->loadAttempt($attempt), false];
                }
                $attempt = Attempt::create([
                    'user_id' => $user->id,
                    'quiz_id' => $lockedQuiz->id,
                    'active_quiz_id' => $lockedQuiz->id,
                    'score' => 0,
                    'status' => 'active',
                    'total_questions' => $lockedQuiz->questions->count(),
                    'started_at' => now(),
                ]);

                return [$this->loadAttempt($attempt), true];
            });
        } catch (QueryException $exception) {
            $attempt = Attempt::query()->where('user_id', $user->id)->where('active_quiz_id', $quiz->id)->first();
            if (! $attempt) {
                throw $exception;
            }

            return [$this->loadAttempt($attempt), false];
        }
    }

    public function answer(User $user, Attempt $attempt, Question $question, Answer $answer): AttemptAnswer
    {
        return DB::transaction(function () use ($user, $attempt, $question, $answer): AttemptAnswer {
            $lockedAttempt = Attempt::query()->with('quiz')->lockForUpdate()->findOrFail($attempt->id);
            $this->assertOwnerAndActive($user, $lockedAttempt);
            if ((int) $question->quiz_id !== (int) $lockedAttempt->quiz_id || (int) $answer->question_id !== (int) $question->id) {
                throw new LessonQuizException('VALIDATION_ERROR', 422, 'The selected answer does not belong to this question.');
            }
            $existing = AttemptAnswer::query()->where('attempt_id', $lockedAttempt->id)->where('question_id', $question->id)->first();
            if ($existing) {
                if ((int) $existing->answer_id === (int) $answer->id) {
                    return $existing;
                }
                throw new LessonQuizException('ANSWER_LOCKED', 409, 'An answer was already submitted for this question.');
            }

            return AttemptAnswer::create([
                'attempt_id' => $lockedAttempt->id,
                'question_id' => $question->id,
                'answer_id' => $answer->id,
                'answer_content_snapshot' => $answer->content,
                'is_correct' => $answer->is_correct,
                'explanation_snapshot' => $question->explanation,
            ]);
        });
    }

    public function complete(User $user, Attempt $attempt): Attempt
    {
        return DB::transaction(function () use ($user, $attempt): Attempt {
            $lockedAttempt = Attempt::query()->with(['answers', 'quiz.lesson'])->lockForUpdate()->findOrFail($attempt->id);
            $this->assertOwner($user, $lockedAttempt);
            if ($lockedAttempt->status === 'completed') {
                return $lockedAttempt;
            }
            if ($lockedAttempt->answers->count() !== (int) $lockedAttempt->total_questions) {
                throw new LessonQuizException('ATTEMPT_INCOMPLETE', 409, 'Answer every question before completing this attempt.');
            }
            $correct = $lockedAttempt->answers->where('is_correct', true)->count();
            $total = (int) $lockedAttempt->total_questions;
            $score = $total > 0 ? (int) round(($correct / $total) * 100) : 0;
            $completedAt = now('UTC');
            $lockedAttempt->update([
                'status' => 'completed',
                'score' => $score,
                'correct_answers' => $correct,
                'completed_at' => $completedAt,
                'active_quiz_id' => null,
            ]);

            $quiz = $lockedAttempt->quiz;
            if ($quiz?->lesson && $score >= (int) $quiz->passing_score) {
                $progress = Progress::query()->firstOrNew([
                    'user_id' => $user->id,
                    'lesson_id' => $quiz->lesson_id,
                ]);
                $progress->status = 'completed';
                $progress->best_score = max((int) ($progress->best_score ?? 0), $score);
                $progress->completed_at ??= $completedAt;
                $progress->save();

                $enrollment = Enrollment::query()
                    ->where('user_id', $user->id)
                    ->where('course_id', $quiz->lesson->course_id)
                    ->where('status', 'active')
                    ->lockForUpdate()
                    ->first();
                if ($enrollment && ! $this->paths->hasIncompleteLessons($user, $enrollment)) {
                    $enrollment->update(['status' => 'completed', 'completed_at' => $completedAt]);
                }
            }

            return $lockedAttempt->fresh();
        });
    }

    public function show(User $user, Attempt $attempt): Attempt
    {
        $this->assertOwner($user, $attempt);

        return $this->loadAttempt($attempt);
    }

    public function assertAvailable(User $user, Quiz $quiz): void
    {
        if ($quiz->status !== 'published' || $quiz->lesson?->status !== 'published'
            || ! $this->eligibleForLesson($user, $quiz->lesson_id, $quiz->lesson->course_id)) {
            throw new LessonQuizException('NOT_FOUND', 404, 'The requested quiz is unavailable.');
        }
    }

    private function assertOwner(User $user, Attempt $attempt): void
    {
        if ((int) $attempt->user_id !== (int) $user->id) {
            throw new LessonQuizException('FORBIDDEN', 403, 'You do not own this attempt.');
        }
    }

    private function assertOwnerAndActive(User $user, Attempt $attempt): void
    {
        $this->assertOwner($user, $attempt);
        if ($attempt->status !== 'active') {
            throw new LessonQuizException('FORBIDDEN', 403, 'This attempt is no longer active.');
        }
    }

    private function loadAttempt(Attempt $attempt): Attempt
    {
        return $attempt->fresh(['quiz.lesson', 'quiz.questions.answers', 'answers']);
    }
}
