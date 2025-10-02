export type StepsProps = {
    steps: string[];
};

export const Steps = ({ steps }: StepsProps) => {
    return (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 shadow-lg w-full max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">📋</span>
                </div>
                <h2 className="text-xl font-semibold text-white">Action Steps</h2>
            </div>
            <div className="space-y-3">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {index + 1}
                        </div>
                        <p className="text-gray-200 leading-relaxed flex-1">
                            {step}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};