"use client";

interface CourseProgressPanelProps {
  enrollmentId: string;
  manifest: any;
  progress: any;
  isExpanded: boolean;
  onToggle: () => void;
}

interface ModuleProgress {
  moduleId: string;
  moduleTitle: string;
  completed: number;
  total: number;
  percentage: number;
}

export function CourseProgressPanel({
  enrollmentId: _enrollmentId,
  manifest,
  progress,
  isExpanded,
  onToggle,
}: CourseProgressPanelProps) {
  // Calculate module-by-module progress
  const moduleProgress: ModuleProgress[] =
    manifest?.modules?.map((module: any) => {
      const total = module.lessons?.length || 0;
      const completed =
        module.lessons?.filter((lesson: any) => progress?.completedLessons?.includes(lesson.id))
          .length || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        moduleId: module.id,
        moduleTitle: module.title,
        completed,
        total,
        percentage,
      };
    }) || [];

  // Calculate total watch time
  const totalWatchTime =
    manifest?.modules
      ?.flatMap((m: any) => m.lessons || [])
      .filter((lesson: any) => progress?.completedLessons?.includes(lesson.id))
      .reduce((sum: number, lesson: any) => sum + (parseInt(lesson.duration) || 0), 0) || 0;

  // Calculate current streak
  const calculateStreak = () => {
    if (!progress?.completedLessons || progress.completedLessons.length === 0) {
      return 0;
    }

    // For now, return a placeholder value
    // In a real implementation, this would check completion dates
    // and calculate consecutive days
    return 0;
  };

  const currentStreak = calculateStreak();

  // Format duration in hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-secondary transition-colors"
        aria-expanded={isExpanded}
        aria-label="Toggle course progress panel"
      >
        <svg
          className="w-5 h-5 text-foreground-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span className="text-sm font-medium text-foreground">Course Progress</span>
        <svg
          className={`w-4 h-4 text-foreground-secondary transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-surface border border-border rounded-lg shadow-lg z-50">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Course Progress</h3>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-background border border-border rounded-lg p-4">
                <div className="text-2xl font-bold text-primary mb-1">
                  {progress?.completedLessons?.length || 0}
                </div>
                <div className="text-xs text-foreground-secondary">Lessons Completed</div>
              </div>
              <div className="bg-background border border-border rounded-lg p-4">
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatDuration(totalWatchTime)}
                </div>
                <div className="text-xs text-foreground-secondary">Total Watch Time</div>
              </div>
              <div className="bg-background border border-border rounded-lg p-4">
                <div className="text-2xl font-bold text-primary mb-1">{currentStreak}</div>
                <div className="text-xs text-foreground-secondary">Day Streak</div>
              </div>
              <div className="bg-background border border-border rounded-lg p-4">
                <div className="text-2xl font-bold text-primary mb-1">
                  {Math.round(
                    ((progress?.completedLessons?.length || 0) /
                      (manifest?.modules?.reduce(
                        (sum: number, m: any) => sum + (m.lessons?.length || 0),
                        0
                      ) || 1)) *
                      100
                  )}
                  %
                </div>
                <div className="text-xs text-foreground-secondary">Overall Progress</div>
              </div>
            </div>

            {/* Module Progress */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Progress by Module</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {moduleProgress.map((module) => (
                  <div key={module.moduleId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground line-clamp-1">
                        {module.moduleTitle}
                      </span>
                      <span className="text-xs font-medium text-foreground-secondary">
                        {module.completed}/{module.total}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="bg-border rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${module.percentage}%` }}
                        />
                      </div>
                      <span className="absolute right-0 -top-5 text-xs font-semibold text-primary">
                        {module.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
