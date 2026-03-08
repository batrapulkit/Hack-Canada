import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatsCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    trendDirection = 'up',
    isLoading
}) {
    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between space-x-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-12" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">{value}</h2>
                            {trend && (
                                <span className={`flex items-center text-xs font-medium ${trendDirection === 'up' ? 'text-emerald-600' : 'text-red-600'
                                    }`}>
                                    {trendDirection === 'up' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                    {trend}
                                </span>
                            )}
                        </div>
                        {description && (
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                    <div className="p-3 bg-slate-900/5 rounded-full ring-1 ring-slate-900/5">
                        <Icon className="w-5 h-5 text-slate-700" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
