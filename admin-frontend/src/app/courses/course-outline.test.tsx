import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CourseOutline } from './page';
import { adminLessons, adminUnits, type AdminCourse, type AdminLesson, type AdminUnit } from '@/lib/api';

const course = { id: 7, title: 'English A1', slug: 'english-a1', status: 'draft' } as AdminCourse;
const lesson = {
  id: 31,
  course: { id: 7, title: 'English A1' },
  title: 'Lesson one',
  slug: 'lesson-one',
  sort_order: 0,
  status: 'draft',
  unit_id: 11,
  prerequisite_ids: [],
  source_system: 'local',
  catalog_revision: 1,
  vocabularies_count: 0,
  quizzes_count: 0,
} as AdminLesson;
const units = [
  {
    id: 11,
    course_id: 7,
    title: 'Foundations',
    sort_order: 0,
    status: 'draft',
    source_system: 'local',
    catalog_revision: 2,
    lessons: [lesson],
  },
  {
    id: 12,
    course_id: 7,
    title: 'Practice',
    sort_order: 1,
    status: 'published',
    source_system: 'lexilingo',
    catalog_revision: 4,
    lessons: [],
  },
] as AdminUnit[];

describe('course outline editor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(adminUnits, 'list').mockResolvedValue(units);
    vi.spyOn(adminLessons, 'list').mockResolvedValue({ data: [lesson], meta: { page: 1, per_page: 100, total: 1, last_page: 1 } });
  });

  it('renders status, provenance and performs server-confirmed reorder and assignment', async () => {
    const reorder = vi.spyOn(adminUnits, 'reorder').mockResolvedValue([...units].reverse());
    const updateLesson = vi.spyOn(adminLessons, 'update').mockResolvedValue({ ...lesson, unit_id: 12 });
    render(<CourseOutline course={course} />);

    expect(screen.getByText('Đang tải dàn ý khóa học…')).toBeInTheDocument();
    const foundation = await screen.findByRole('article', { name: 'Foundations' });
    expect(within(foundation).getByText('Sửa cục bộ')).toBeInTheDocument();
    expect(screen.getByText('Nguồn bên ngoài')).toBeInTheDocument();

    fireEvent.click(within(foundation).getByRole('button', { name: 'Chuyển xuống' }));
    await waitFor(() => expect(reorder).toHaveBeenCalledWith(7, [12, 11]));

    fireEvent.change(screen.getByRole('combobox', { name: 'Xếp chặng cho Lesson one' }), { target: { value: '12' } });
    await waitFor(() => expect(updateLesson).toHaveBeenCalledWith(31, expect.objectContaining({
      unit_id: 12,
      prerequisite_ids: [],
    })));
  });

  it('shows empty and recoverable error states without changing local order', async () => {
    vi.spyOn(adminUnits, 'reorder').mockRejectedValue(new Error('Order conflict'));
    const { rerender } = render(<CourseOutline course={course} />);
    const foundation = await screen.findByRole('article', { name: 'Foundations' });
    fireEvent.click(within(foundation).getByRole('button', { name: 'Chuyển xuống' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Order conflict');
    expect(screen.getAllByRole('article')[0]).toHaveAccessibleName('Foundations');

    vi.spyOn(adminUnits, 'list').mockResolvedValue([]);
    rerender(<CourseOutline course={{ ...course, id: 8 }} />);
    expect(await screen.findByText('Chưa có chặng nào')).toBeInTheDocument();
  });

  it('creates and edits a unit from the inline editor', async () => {
    vi.spyOn(adminUnits, 'list').mockResolvedValue([units[0], { ...units[1], sort_order: 2 }]);
    const create = vi.spyOn(adminUnits, 'create').mockResolvedValue(units[0]);
    const update = vi.spyOn(adminUnits, 'update').mockResolvedValue({ ...units[0], title: 'Core foundations' });
    render(<CourseOutline course={course} />);
    await screen.findByRole('article', { name: 'Foundations' });

    fireEvent.click(screen.getByRole('button', { name: 'Thêm chặng' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Tên chặng' }), { target: { value: 'Conversation' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu chặng' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ course_id: 7, title: 'Conversation', sort_order: 3 })));

    fireEvent.click(within(screen.getByRole('article', { name: 'Foundations' })).getByRole('button', { name: 'Sửa' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Tên chặng' }), { target: { value: 'Core foundations' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu chặng' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith(11, expect.objectContaining({ title: 'Core foundations' })));
  });
});
