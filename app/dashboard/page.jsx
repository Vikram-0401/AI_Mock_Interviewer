"use client";
import { UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  PlayCircle,
  Target,
  Award,
  BarChart3,
  Plus,
  Zap,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import AddNewInterView from "./_components/AddNewInterView";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { db } from "@/utils/db";
import { MockInterview, UserAnswer } from "@/utils/schema";
import { eq, desc, sql } from "drizzle-orm";
import { useUser } from "@clerk/nextjs";

export default function Dashboard() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  
  // State for real data
  const [stats, setStats] = useState({
    totalInterviews: 0,
    thisMonth: 0,
    averageScore: 0,
    totalTimeSpent: 0
  });
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      
      // Fetch user's interviews
      const userInterviews = await db
        .select()
        .from(MockInterview)
        .where(eq(MockInterview.createdBy, userEmail))
        .orderBy(desc(MockInterview.createdAt));

      // Calculate total interviews
      const totalInterviews = userInterviews.length;

      // Calculate this month's interviews
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const thisMonthInterviews = userInterviews.filter(interview => {
        const interviewDate = new Date(interview.createdAt);
        return interviewDate >= firstDayOfMonth;
      }).length;

      // Calculate average score and total time
      let totalScore = 0;
      let totalTime = 0;
      let scoredInterviews = 0;

      for (const interview of userInterviews) {
        // Get answers for this interview
        const answers = await db
          .select()
          .from(UserAnswer)
          .where(eq(UserAnswer.mockIdRef, interview.mockId));

        if (answers.length > 0) {
          // Check if interview has been evaluated (has ratings)
          const evaluatedAnswers = answers.filter(answer => answer.rating);
          
          if (evaluatedAnswers.length > 0) {
            const interviewScore = evaluatedAnswers.reduce((sum, answer) => {
              const rating = parseInt(answer.rating) || 0;
              return sum + rating;
            }, 0) / evaluatedAnswers.length;
            
            totalScore += interviewScore;
            scoredInterviews++;
            
            // Estimate time spent (assuming 5 minutes per question)
            totalTime += answers.length * 5;
          }
        }
      }

      const averageScore = scoredInterviews > 0 ? Math.round((totalScore / scoredInterviews) * 10) / 10 : 0;
      const totalTimeHours = Math.round((totalTime / 60) * 10) / 10;

      // Get recent interviews with scores
      const recentInterviewsWithScores = await Promise.all(
        userInterviews.slice(0, 5).map(async (interview) => {
          const answers = await db
            .select()
            .from(UserAnswer)
            .where(eq(UserAnswer.mockIdRef, interview.mockId));

          let score = 0;
          let status = 'incomplete';
          
          if (answers.length > 0) {
            // Check if interview has been evaluated
            const evaluatedAnswers = answers.filter(answer => answer.rating);
            
            if (evaluatedAnswers.length > 0) {
              score = Math.round((evaluatedAnswers.reduce((sum, answer) => {
                const rating = parseInt(answer.rating) || 0;
                return sum + rating;
              }, 0) / evaluatedAnswers.length) * 10) / 10;
              
              status = 'completed';
            }
          }

          // Format date
          const interviewDate = new Date(interview.createdAt);
          const now = new Date();
          const diffTime = Math.abs(now - interviewDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let dateText = '';
          if (diffDays === 1) dateText = '1 day ago';
          else if (diffDays < 7) dateText = `${diffDays} days ago`;
          else if (diffDays < 30) dateText = `${Math.ceil(diffDays / 7)} weeks ago`;
          else dateText = `${Math.ceil(diffDays / 30)} months ago`;

          return {
            id: interview.mockId,
            role: interview.jobPosition,
            company: interview.jobDesc?.split('•')[0]?.trim() || 'Company',
            date: dateText,
            score: score,
            status: status,
            createdAt: interview.createdAt
          };
        })
      );

      setStats({
        totalInterviews,
        thisMonth: thisMonthInterviews,
        averageScore,
        totalTimeSpent: totalTimeHours
      });

      setRecentInterviews(recentInterviewsWithScores);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const statsData = [
    {
      title: "Total Interviews",
      value: stats.totalInterviews.toString(),
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "This Month",
      value: stats.thisMonth.toString(),
      icon: Calendar,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Average Score",
      value: stats.averageScore > 0 ? stats.averageScore.toString() : "N/A",
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Time Spent",
      value: stats.totalTimeSpent > 0 ? `${stats.totalTimeSpent}h` : "N/A",
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  const quickActions = [
    {
      title: "View Progress",
      description: "Track your improvement over time",
      icon: BarChart3,
      href: "/dashboard/progress",
      color: "bg-gradient-to-r from-green-500 to-teal-600",
    },
    {
      title: "Practice Questions",
      description: "Sharpen your skills with practice",
      icon: Target,
      href: "/dashboard/practice",
      color: "bg-gradient-to-r from-orange-500 to-red-600",
    },
    {
      title: "Interview Tips",
      description: "Learn best practices and strategies",
      icon: Award,
      href: "/dashboard/tips",
      color: "bg-gradient-to-r from-purple-500 to-pink-600",
    },
  ];

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const currentTheme = resolvedTheme || theme;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50 sticky top-0 z-50 transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Interview Pro
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setTheme(currentTheme === "dark" ? "light" : "dark")
                }
                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200"
                aria-label="Toggle dark mode"
              >
                {currentTheme === "dark" ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </motion.button>
              <UserButton />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Ready to ace your next interview? Let's practice and improve
            together.
          </p>
        </motion.div>

        {/* Start New Interview Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-8"
        >
                  <AddNewInterView />
        </motion.div>

        {/* Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, index) => (
              <Card
              key={stat.title}
                className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
            >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        ) : (
                          stat.value
                        )}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bgColor}`}
                    >
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
          ))}
          </div>
        </motion.div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                    <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                      <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${action.color} text-white group-hover:scale-110 transition-transform duration-200`}
                      >
                      <action.icon className="w-6 h-6" />
                      </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {action.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </div>
                    </CardContent>
                  </Card>
            ))}
          </div>
        </motion.div>

        {/* Recent Interviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Interviews
            </h3>
            {recentInterviews.length > 0 && (
              <Link href="/dashboard/interviews">
                <Button variant="outline" size="sm">
              View All
            </Button>
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading interviews...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={fetchDashboardData} variant="outline">
                Try Again
              </Button>
            </div>
          ) : recentInterviews.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlayCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No interviews yet
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start your first mock interview to see your progress here
                </p>
                <AddNewInterView />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentInterviews.map((interview) => (
                <Card
                    key={interview.id}
                  className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
                  >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <PlayCircle className="w-5 h-5 text-white" />
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          interview.status === "completed"
                            ? "border-green-300 text-green-700 dark:border-green-600 dark:text-green-300"
                            : "border-yellow-300 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300"
                        }
                      >
                        {interview.status === "completed" ? "Completed" : "Incomplete"}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {interview.role}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {interview.company} • {interview.date}
                    </p>
                    {interview.score > 0 && (
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Score
                        </span>
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          {interview.score}/10
                        </span>
                      </div>
                    )}
                    <Link href={`/dashboard/interview/${interview.id}/feedback`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
                      >
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                ))}
              </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
