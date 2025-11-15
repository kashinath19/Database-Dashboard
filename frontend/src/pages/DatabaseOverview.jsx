import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Database, Users, Contact, FileText, Calendar, User, UserCheck, BarChart3, Star, Podcast, MessageSquare, GraduationCap, MessageCircle } from 'lucide-react';
import { formatRelativeTime, capitalize } from '../utils/formatters';

export const DatabaseOverview = () => {
  const { database } = useParams();
  const navigate = useNavigate();
  const { data: stats, loading, error } = useApi('/database/stats');

  // Fetch recent records for the specific database with correct timestamp columns
  const { data: recentUsers, loading: usersLoading, error: usersError } = useApi(database === 'resumes' ? '/users?page=1&limit=3&sort_by=created_at&sort_order=desc' : null);
  const { data: recentContacts, loading: contactsLoading, error: contactsError } = useApi(database === 'resumes' ? '/contacts?page=1&limit=3&sort_by=created_at&sort_order=desc' : null);
  const { data: recentResumes, loading: resumesLoading, error: resumesError } = useApi(database === 'resumes' ? '/generated_resumes?page=1&limit=3&sort_by=created_at&sort_order=desc' : null);
  
  // Use correct timestamp columns for prescreening database
  const { data: recentCandidates, loading: candidatesLoading, error: candidatesError } = useApi(database === 'prescreening' ? '/candidates?page=1&limit=3&sort_by=timestamp&sort_order=desc' : null);
  const { data: recentEvaluations, loading: evaluationsLoading, error: evaluationsError } = useApi(database === 'prescreening' ? '/evaluations?page=1&limit=3&sort_by=timestamp&sort_order=desc' : null);
  const { data: recentPodcastQuestions, loading: podcastLoading, error: podcastError } = useApi(database === 'prescreening' ? '/podcast_questions?page=1&limit=3&sort_by=timestamp&sort_order=desc' : null);
  const { data: recentProgramComments, loading: programCommentsLoading, error: programCommentsError } = useApi(database === 'prescreening' ? '/program_comments?page=1&limit=3&sort_by=timestamp&sort_order=desc' : null);
  const { data: recentProgramStats, loading: programStatsLoading, error: programStatsError } = useApi(database === 'prescreening' ? '/program_stats?page=1&limit=3&sort_by=updated_at&sort_order=desc' : null);
  const { data: recentReviewFeedbacks, loading: reviewFeedbacksLoading, error: reviewFeedbacksError } = useApi(database === 'prescreening' ? '/review_feedbacks?page=1&limit=3&sort_by=timestamp&sort_order=desc' : null);
  const { data: recentStudentContacts, loading: studentContactsLoading, error: studentContactsError } = useApi(database === 'prescreening' ? '/student_contacts?page=1&limit=3&sort_by=timestamp&sort_order=desc' : null);

  // Fetch recent records for conversations database
  const { data: recentConversationsUsers, loading: conversationsUsersLoading, error: conversationsUsersError } = useApi(database === 'conversations' ? '/conversations/users?page=1&limit=3&sort_by=created_at&sort_order=desc' : null);

  const databaseConfig = {
    resumes: {
      id: 'resumes',
      name: 'Gigaversity / Resume Data',
      description: 'Gigaversity.in user resumes and contact information',
      color: 'blue',
      icon: Database,
      tables: [
        {
          name: 'Resume Users',
          slug: 'users',
          icon: Users,
          description: 'Registered users from Gigaversity.in'
        },
        {
          name: 'Website Form Submissions',
          slug: 'contacts',
          icon: Contact,
          description: 'Contact form submissions'
        },
        {
          name: 'Generated Resumes',
          slug: 'generated_resumes',
          icon: FileText,
          description: 'Generated resumes'
        }
      ]
    },
    prescreening: {
      id: 'prescreening',
      name: 'Scholarship / Prescreening Data',
      description: 'Candidate evaluation and prescreening data',
      color: 'purple',
      icon: UserCheck,
      tables: [
        {
          name: 'Candidates',
          slug: 'candidates',
          icon: UserCheck,
          description: 'Candidate information'
        },
        {
          name: 'Evaluations',
          slug: 'evaluations',
          icon: BarChart3,
          description: 'Candidate evaluations'
        },
        {
          name: 'Podcast Questions',
          slug: 'podcast_questions',
          icon: Podcast,
          description: 'Podcast interview questions'
        },
        {
          name: 'Program Comments',
          slug: 'program_comments',
          icon: MessageSquare,
          description: 'Program feedback comments'
        },
        {
          name: 'Program Stats',
          slug: 'program_stats',
          icon: BarChart3,
          description: 'Program statistics'
        },
        {
          name: 'Review Feedbacks',
          slug: 'review_feedbacks',
          icon: Star,
          description: 'Review feedback data'
        },
        {
          name: 'Student Contacts',
          slug: 'student_contacts',
          icon: GraduationCap,
          description: 'Student contact information'
        }
      ]
    },
    conversations: {
      id: 'conversations',
      name: 'GigaSpace Data',
      description: 'User accounts and authentication data',
      color: 'green',
      icon: MessageCircle,
      tables: [
        {
          name: 'GigaSpace Users',
          slug: 'users',
          icon: Users,
          description: 'Registered users in the GigaSpace Website'
        }
      ]
    }
  };

  const currentDatabase = databaseConfig[database];

  // FIXED: Get table count from the API response structure - CORRECTED MAPPING FOR PRESCREENING
  const getTableCount = (tableSlug) => {
    if (!stats?.databases) return 0;
    
    // Map frontend database IDs to backend database names - FIXED: Use consistent naming
    const databaseMap = {
      resumes: 'resumes',
      prescreening: 'prescreening', // FIXED: Changed from 'prescreening_test' to 'prescreening'
      conversations: 'conversations'
    };
    
    const backendDbName = databaseMap[database];
    if (!backendDbName) return 0;
    
    const dbStats = stats.databases[backendDbName];
    if (!dbStats) {
      console.log(`No stats found for database: ${backendDbName}`);
      console.log('Available databases in stats:', Object.keys(stats.databases));
      return 0;
    }
    
    // Map table slugs to the backend table names - FIXED: Consistent with actual backend table names
    const tableMap = {
      resumes: {
        users: 'users',
        contacts: 'contacts',
        generated_resumes: 'generated_resumes'
      },
      prescreening: {
        candidates: 'candidates',
        evaluations: 'evaluations',
        podcast_questions: 'podcast_questions',
        program_comments: 'program_comments',
        program_stats: 'program_stats',
        review_feedbacks: 'review_feedbacks',
        student_contacts: 'student_contacts'
      },
      conversations: {
        users: 'users'
      }
    };
    
    const backendTableName = tableMap[database]?.[tableSlug];
    const count = backendTableName ? dbStats[backendTableName] || 0 : 0;
    
    console.log(`Table count for ${database}.${tableSlug} (backend: ${backendTableName}):`, count);
    return count;
  };

  const handleTableClick = (tableSlug) => {
    navigate(`/database/${database}/${tableSlug}`);
  };

  // Helper function to check if data is available and not in error state
  const hasData = (data, error) => {
    return data?.data?.length > 0 && !error;
  };

  // Helper function to check if still loading
  const isLoading = (loadingState) => {
    return loadingState;
  };

  // Helper function to check if there's an error
  const hasError = (errorState) => {
    return errorState;
  };

  // Render functions for recent activity
  const renderRecentUser = (user) => (
    <div 
      key={user.id}
      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
      onClick={() => navigate(`/database/resumes/users/${user.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
          <User className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.name || 'Unnamed User'}
          </p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {user.created_at ? formatRelativeTime(user.created_at) : 'No date'}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800`}>
          {capitalize(user.auth_method || 'email')}
        </span>
      </div>
    </div>
  );

  const renderRecentContact = (contact) => (
    <div 
      key={contact.id}
      className="p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-colors cursor-pointer"
      onClick={() => navigate(`/database/resumes/contacts/${contact.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
          <Contact className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {contact.name || 'Unnamed Contact'}
          </p>
          <p className="text-xs text-gray-500 truncate">{contact.email}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {contact.created_at ? formatRelativeTime(contact.created_at) : 'No date'}
        </span>
        {contact.subject && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full truncate max-w-20">
            {contact.subject}
          </span>
        )}
      </div>
    </div>
  );

  const renderRecentResume = (resume) => {
    const experience = resume.experience || 0;
    
    return (
      <div 
        key={resume.id}
        className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
        onClick={() => navigate(`/database/resumes/generated_resumes/${resume.id}`)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
            <FileText className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              Resume #{resume.id}
            </p>
            <p className="text-xs text-gray-500">User {resume.user_id}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {resume.created_at ? formatRelativeTime(resume.created_at) : 'No date'}
          </span>
          {experience > 0 && (
            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
              {experience}y exp
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderRecentCandidate = (candidate) => (
    <div 
      key={candidate.id}
      className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
      onClick={() => navigate(`/database/prescreening/candidates/${candidate.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
          <UserCheck className="h-4 w-4 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {candidate.name || candidate.email || 'Unnamed Candidate'}
          </p>
          <p className="text-xs text-gray-500 truncate">{candidate.email || `Candidate ${candidate.id}`}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {candidate.timestamp ? formatRelativeTime(candidate.timestamp) : 'No date'}
        </span>
        {candidate.status && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            candidate.status === 'active' ? 'bg-green-100 text-green-800' :
            candidate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {capitalize(candidate.status)}
          </span>
        )}
      </div>
    </div>
  );

  const renderRecentEvaluation = (evaluation) => (
    <div 
      key={evaluation.id}
      className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
      onClick={() => navigate(`/database/prescreening/evaluations/${evaluation.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
          <BarChart3 className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {evaluation.candidate_name || evaluation.evaluator_name || 'Evaluation'}
          </p>
          <p className="text-xs text-gray-500">
            {evaluation.evaluator_name ? `By ${evaluation.evaluator_name}` : `Evaluation ${evaluation.id}`}
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {evaluation.timestamp ? formatRelativeTime(evaluation.timestamp) : 'No date'}
        </span>
        {evaluation.score && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            Score: {evaluation.score}
          </span>
        )}
      </div>
    </div>
  );

  const renderRecentPodcastQuestion = (question) => (
    <div 
      key={question.id}
      className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
      onClick={() => navigate(`/database/prescreening/podcast_questions/${question.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
          <Podcast className="h-4 w-4 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {question.question_text?.substring(0, 50) || question.category || 'Unnamed Question'}...
          </p>
          <p className="text-xs text-gray-500">{question.category || 'No category'}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {question.timestamp ? formatRelativeTime(question.timestamp) : 'No date'}
        </span>
        {question.duration && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            {question.duration}s
          </span>
        )}
      </div>
    </div>
  );

  const renderRecentProgramComment = (comment) => (
    <div 
      key={comment.id}
      className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
      onClick={() => navigate(`/database/prescreening/program_comments/${comment.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
          <MessageSquare className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {comment.author_name || 'Anonymous'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {comment.comment_text?.substring(0, 40) || `Comment ${comment.id}`}...
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {comment.timestamp ? formatRelativeTime(comment.timestamp) : 'No date'}
        </span>
        {comment.rating && (
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            {comment.rating}★
          </span>
        )}
      </div>
    </div>
  );

  const renderRecentProgramStat = (stat) => (
    <div 
      key={stat.id}
      className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
      onClick={() => navigate(`/database/prescreening/program_stats/${stat.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
          <BarChart3 className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {stat.program_id || 'Program Stats'}
          </p>
          <p className="text-xs text-gray-500">
            Likes: {stat.likes_count || 0} • Comments: {stat.comments_count || 0}
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {stat.updated_at ? formatRelativeTime(stat.updated_at) : 'No date'}
        </span>
        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
          Stats
        </span>
      </div>
    </div>
  );

  const renderRecentReviewFeedback = (feedback) => (
    <div 
      key={feedback.id}
      className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
      onClick={() => navigate(`/database/prescreening/review_feedbacks/${feedback.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
          <Star className="h-4 w-4 text-yellow-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {feedback.name || feedback.email || 'Feedback'}
          </p>
          <p className="text-xs text-gray-500">
            {feedback.email ? `By ${feedback.email}` : `Feedback ${feedback.id}`}
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {feedback.timestamp ? formatRelativeTime(feedback.timestamp) : 'No date'}
        </span>
        {feedback.love_rating && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            {feedback.love_rating}★
          </span>
        )}
      </div>
    </div>
  );

  const renderRecentStudentContact = (contact) => (
    <div 
      key={contact.id}
      className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
      onClick={() => navigate(`/database/prescreening/student_contacts/${contact.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full">
          <GraduationCap className="h-4 w-4 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {contact.name || contact.email || 'Unnamed Student'}
          </p>
          <p className="text-xs text-gray-500 truncate">{contact.email || `Student ${contact.id}`}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {contact.timestamp ? formatRelativeTime(contact.timestamp) : 'No date'}
        </span>
        {contact.year_of_graduation && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full truncate max-w-20">
            Grad: {contact.year_of_graduation}
          </span>
        )}
      </div>
    </div>
  );

  // Render function for recent conversations users
  const renderRecentConversationsUser = (user) => (
    <div 
      key={user.id}
      className="p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-colors cursor-pointer"
      onClick={() => navigate(`/database/conversations/users/${user.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
          <User className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.name || user.username || 'Unnamed User'}
          </p>
          <p className="text-xs text-gray-500 truncate">@{user.username}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {user.created_at ? formatRelativeTime(user.created_at) : 'No date'}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          user.is_oauth_user ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {user.is_oauth_user ? 'OAuth' : 'Email'}
        </span>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading database statistics</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentDatabase) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">Database not found</h3>
          <p className="text-yellow-600 text-sm mt-1">The requested database does not exist.</p>
        </div>
      </div>
    );
  }

  // Render a section with error handling
  const renderRecentSection = (title, icon, data, loading, error, renderItem, viewAllPath) => {
    return (
      <div>
        <div className="flex items-center space-x-2 mb-3">
          {icon}
          <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
              <p className="text-sm text-yellow-800 text-center">
                Error loading {title.toLowerCase()}
              </p>
            </div>
          ) : data?.data?.length > 0 ? (
            data.data.map(renderItem)
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No {title.toLowerCase()} found</p>
          )}
        </div>
        <button
          onClick={() => navigate(viewAllPath)}
          className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all {title.toLowerCase()} →
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumb 
        items={[
          { label: 'Home', href: '/' },
          { label: 'Database', href: '/database' },
          { label: currentDatabase.name, href: null }
        ]} 
      />

      {/* Header - Updated to show table count */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`p-2 rounded-lg bg-${currentDatabase.color}-100`}>
            <currentDatabase.icon className={`h-6 w-6 text-${currentDatabase.color}-600`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentDatabase.name}</h1>
            <p className="text-gray-600">
              {currentDatabase.description} • {currentDatabase.tables.length} tables available
            </p>
          </div>
        </div>
      </div>

      {/* Tables Grid - MOVED TO TOP */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Database Tables</h2>
          <p className="text-gray-600">Click on any table to explore its records</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDatabase.tables.map((table) => (
              <div
                key={table.slug}
                className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleTableClick(table.slug)}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`p-3 rounded-lg bg-${currentDatabase.color}-100`}>
                    <table.icon className={`h-6 w-6 text-${currentDatabase.color}-600`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {table.name}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {table.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : getTableCount(table.slug)}
                  </span>
                  <span className="text-sm text-gray-500">records</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity - MOVED TO BOTTOM */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Activity - {currentDatabase.name}
          </h3>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Resumes Database Recent Activity */}
          {database === 'resumes' && (
            <>
              {renderRecentSection(
                'Recent Resume Users Data',
                <Users className="h-4 w-4 text-blue-600" />,
                recentUsers,
                usersLoading,
                usersError,
                renderRecentUser,
                '/database/resumes/users'
              )}

              {renderRecentSection(
                'Recent Website Form Submissions Data',
                <Contact className="h-4 w-4 text-green-600" />,
                recentContacts,
                contactsLoading,
                contactsError,
                renderRecentContact,
                '/database/resumes/contacts'
              )}

              {renderRecentSection(
                'Recent Generated Resumes Data',
                <FileText className="h-4 w-4 text-purple-600" />,
                recentResumes,
                resumesLoading,
                resumesError,
                renderRecentResume,
                '/database/resumes/generated_resumes'
              )}
            </>
          )}

          {/* Prescreening Database Recent Activity */}
          {database === 'prescreening' && (
            <>
              {renderRecentSection(
                'Recent Candidates',
                <UserCheck className="h-4 w-4 text-purple-600" />,
                recentCandidates,
                candidatesLoading,
                candidatesError,
                renderRecentCandidate,
                '/database/prescreening/candidates'
              )}

              {renderRecentSection(
                'Recent Evaluations',
                <BarChart3 className="h-4 w-4 text-blue-600" />,
                recentEvaluations,
                evaluationsLoading,
                evaluationsError,
                renderRecentEvaluation,
                '/database/prescreening/evaluations'
              )}

              {renderRecentSection(
                'Recent Questions',
                <Podcast className="h-4 w-4 text-purple-600" />,
                recentPodcastQuestions,
                podcastLoading,
                podcastError,
                renderRecentPodcastQuestion,
                '/database/prescreening/podcast_questions'
              )}

              {renderRecentSection(
                'Recent Comments',
                <MessageSquare className="h-4 w-4 text-green-600" />,
                recentProgramComments,
                programCommentsLoading,
                programCommentsError,
                renderRecentProgramComment,
                '/database/prescreening/program_comments'
              )}

              {renderRecentSection(
                'Recent Stats',
                <BarChart3 className="h-4 w-4 text-blue-600" />,
                recentProgramStats,
                programStatsLoading,
                programStatsError,
                renderRecentProgramStat,
                '/database/prescreening/program_stats'
              )}

              {renderRecentSection(
                'Recent Feedbacks',
                <Star className="h-4 w-4 text-yellow-600" />,
                recentReviewFeedbacks,
                reviewFeedbacksLoading,
                reviewFeedbacksError,
                renderRecentReviewFeedback,
                '/database/prescreening/review_feedbacks'
              )}

              {renderRecentSection(
                'Recent Students',
                <GraduationCap className="h-4 w-4 text-indigo-600" />,
                recentStudentContacts,
                studentContactsLoading,
                studentContactsError,
                renderRecentStudentContact,
                '/database/prescreening/student_contacts'
              )}
            </>
          )}

          {/* Conversations Database Recent Activity */}
          {database === 'conversations' && (
            <>
              {renderRecentSection(
                'Recent GigaSpace Users Data',
                <Users className="h-4 w-4 text-green-600" />,
                recentConversationsUsers,
                conversationsUsersLoading,
                conversationsUsersError,
                renderRecentConversationsUser,
                '/database/conversations/users'
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};