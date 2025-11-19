import { colors } from '@/lib/design-system';

interface IssueSummaryProps {
  totalIssues: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
}

export function IssueSummary({
  totalIssues,
  highSeverity,
  mediumSeverity,
  lowSeverity,
}: IssueSummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
      {/* Total Issues Card */}
      <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: colors.text.secondary + '30' }}>
        <div 
          className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1"
          style={{ color: colors.text.primary }}
        >
          {totalIssues}
        </div>
        <div 
          className="text-xs sm:text-sm font-medium"
          style={{ color: colors.text.secondary }}
        >
          Total Issues
        </div>
      </div>

      {/* High Severity Card */}
      <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: colors.text.secondary + '30' }}>
        <div 
          className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1"
          style={{ color: colors.status.error }}
        >
          {highSeverity}
        </div>
        <div 
          className="text-xs sm:text-sm font-medium"
          style={{ color: colors.text.secondary }}
        >
          High Severity
        </div>
      </div>

      {/* Medium Severity Card */}
      <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: colors.text.secondary + '30' }}>
        <div 
          className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1"
          style={{ color: colors.status.warning }}
        >
          {mediumSeverity}
        </div>
        <div 
          className="text-xs sm:text-sm font-medium"
          style={{ color: colors.text.secondary }}
        >
          Medium Severity
        </div>
      </div>

      {/* Low Severity Card */}
      <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: colors.text.secondary + '30' }}>
        <div 
          className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1"
          style={{ color: colors.status.info }}
        >
          {lowSeverity}
        </div>
        <div 
          className="text-xs sm:text-sm font-medium"
          style={{ color: colors.text.secondary }}
        >
          Low Severity
        </div>
      </div>
    </div>
  );
}
