"use client";

import { IconAlertTriangle, IconChecklist, IconUsers } from "@tabler/icons-react";
import type { SupervisionAlert, TeacherAssignment, TeacherLearner } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useLanguage } from "@/lib/language";

export function Status({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <Card className="mx-auto max-w-xl p-10 text-center">
      <p role="status" className="font-bold">
        {text}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function TeacherMetrics({
  totalLearners,
  openAlerts,
  pendingAssignments,
}: {
  totalLearners: number;
  openAlerts: number;
  pendingAssignments: number;
}) {
  const { t } = useLanguage();
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Metric icon={IconUsers} value={totalLearners} label={t("Học viên", "Learners")} />
      <Metric icon={IconAlertTriangle} value={openAlerts} label={t("Cảnh báo mở", "Open alerts")} />
      <Metric icon={IconChecklist} value={pendingAssignments} label={t("Bài đang giao", "Active assignments")} />
    </div>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof IconUsers; value: number; label: string }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span aria-hidden="true" className="rounded-2xl bg-accent p-3 text-primary">
        <Icon />
      </span>
      <div>
        <p className="text-3xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

export function MetricSmall({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted p-4">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="rounded-xl bg-muted p-5 text-center text-muted-foreground">{text}</p>;
}

export function TeacherAlerts({
  alerts,
  selectedLearnerId,
  alertStateFilter,
  onFilterChange,
  onResolve,
}: {
  alerts: SupervisionAlert[];
  selectedLearnerId?: number;
  alertStateFilter: string;
  onFilterChange: (state: string) => void;
  onResolve: (alert: SupervisionAlert) => void;
}) {
  const { t, label } = useLanguage();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>{t("Cảnh báo cần can thiệp", "Alerts needing intervention")}</CardTitle>
        <div className="w-40">
          <Select
            aria-label={t("Lọc cảnh báo", "Filter alerts")}
            value={alertStateFilter}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="all">{t("Tất cả trạng thái", "All states")}</option>
            <option value="open">{t("Đang mở", "Open")}</option>
            <option value="resolved">{t("Đã xử lý", "Resolved")}</option>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <Empty text={t("Chưa có cảnh báo.", "No alerts yet.")} />
        ) : (
          alerts.map((alert) => (
            <article key={alert.id} className="rounded-2xl border-2 border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      alert.severity === "critical" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {label(alert.severity)}
                  </span>
                  <h3 className="mt-3 break-words font-display text-xl font-bold">
                    {alert.learner.name} · {alert.rule_key.replaceAll("_", " ")}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {alert.evidence.length} {t("bản ghi", "snapshots")} ·{t("Trạng thái", "State")}: {label(alert.state)}
                  </p>
                </div>
                {alert.state === "open" && (
                  <Button
                    size="sm"
                    variant={selectedLearnerId === alert.learner.id ? "default" : "outline"}
                    onClick={() => onResolve(alert)}
                  >
                    {selectedLearnerId === alert.learner.id ? t("Xác nhận đã xử lý", "Confirm resolved") : t("Xem bằng chứng", "View evidence")}
                  </Button>
                )}
              </div>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function TeacherLearners({
  learners,
  selectedLearnerId,
  onSelect,
}: {
  learners: TeacherLearner[];
  selectedLearnerId?: number;
  onSelect: (id: number) => void;
}) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Học viên được giao", "Assigned learners")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {learners.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full rounded-2xl border-2 p-4 text-left hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              selectedLearnerId === item.id ? "border-primary bg-accent" : "border-transparent bg-muted"
            }`}
          >
            <span className="block font-bold">{item.name}</span>
            <span className="block truncate text-sm text-muted-foreground">{item.email}</span>
          </button>
        ))}
        {learners.length === 0 && <Empty text={t("Chưa có học viên được phân công.", "No learners assigned yet.")} />}
      </CardContent>
    </Card>
  );
}

export function TeacherAssignmentsList({
  assignments,
  assignmentStatusFilter,
  onFilterChange,
  onUpdateStatus,
}: {
  assignments: TeacherAssignment[];
  assignmentStatusFilter: string;
  onFilterChange: (status: string) => void;
  onUpdateStatus: (id: number, status: "pending" | "in_progress" | "cancelled") => void;
}) {
  const { t, label } = useLanguage();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>{t("Bài đã giao", "Assignments")}</CardTitle>
        <div className="w-48">
          <Select
            aria-label={t("Lọc bài đã giao", "Filter assignments")}
            value={assignmentStatusFilter}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="all">{t("Tất cả trạng thái", "All states")}</option>
            <option value="pending">{t("Đang chờ", "Pending")}</option>
            <option value="in_progress">{t("Đang hỗ trợ", "In progress")}</option>
            <option value="completed">{t("Đã hoàn thành", "Completed")}</option>
            <option value="cancelled">{t("Đã hủy", "Cancelled")}</option>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {assignments.map((item) => (
          <article key={item.id} className="rounded-2xl border-2 border-border p-4">
            <p className="font-bold">{item.learner.name}</p>
            <p className="mt-1 text-sm">{item.lesson?.title ?? item.vocabulary?.word ?? t("Không có nội dung giao", "No target")}</p>
            <span
              className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${
                item.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : item.status === "in_progress"
                  ? "bg-blue-100 text-blue-800"
                  : item.status === "cancelled"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {label(item.status)}
            </span>
            {(item.status === "pending" || item.status === "in_progress" || item.status === "cancelled") && (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.status !== "in_progress" && (
                  <Button size="sm" variant="outline" onClick={() => onUpdateStatus(item.id, "in_progress")}>
                    {t("Đang hỗ trợ", "In progress")}
                  </Button>
                )}
                {item.status !== "cancelled" && (
                  <Button size="sm" variant="ghost" onClick={() => onUpdateStatus(item.id, "cancelled")}>
                    {t("Hủy", "Cancel")}
                  </Button>
                )}
                {item.status === "cancelled" && (
                  <Button size="sm" variant="outline" onClick={() => onUpdateStatus(item.id, "pending")}>
                    {t("Mở lại", "Reopen")}
                  </Button>
                )}
              </div>
            )}
          </article>
        ))}
        {assignments.length === 0 && <Empty text={t("Chưa có bài đã giao.", "No assignments yet.")} />}
      </CardContent>
    </Card>
  );
}
