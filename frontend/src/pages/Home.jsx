import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
<<<<<<< HEAD
import { Database, Calendar, User, UserCheck, BarChart3, Star, Podcast, MessageSquare, GraduationCap, MessageCircle } from 'lucide-react';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { formatRelativeTime, capitalize } from '../utils/formatters';

export const Home = () => {
  const navigate = useNavigate();
  const { data: stats, loading: statsLoading, error: statsError } = useApi('/database/stats');
  
  // Fetch recent records for each table from all databases
  const { data: recentUsers, loading: usersLoading } = useApi('/users?page=1&limit=3&sort_by=created_at&sort_order=desc');
  const { data: recentContacts, loading: contactsLoading } = useApi('/contacts?page=1&limit=3&sort_by=created_at&sort_order=desc');
  const { data: recentResumes, loading: resumesLoading } = useApi('/generated_resumes?page=1&limit=3&sort_by=created_at&sort_order=desc');
  
  // Use correct timestamp columns for prescreening database
  const { data: recentCandidates, loading: candidatesLoading } = useApi('/candidates?page=1&limit=3&sort_by=timestamp&sort_order=desc');
  const { data: recentEvaluations, loading: evaluationsLoading } = useApi('/evaluations?page=1&limit=3&sort_by=timestamp&sort_order=desc');
  const { data: recentPodcastQuestions, loading: podcastLoading } = useApi('/podcast_questions?page=1&limit=3&sort_by=timestamp&sort_order=desc');
  const { data: recentProgramComments, loading: programCommentsLoading } = useApi('/program_comments?page=1&limit=3&sort_by=timestamp&sort_order=desc');
  const { data: recentProgramStats, loading: programStatsLoading } = useApi('/program_stats?page=1&limit=3&sort_by=updated_at&sort_order=desc');
  const { data: recentReviewFeedbacks, loading: reviewFeedbacksLoading } = useApi('/review_feedbacks?page=1&limit=3&sort_by=timestamp&sort_order=desc');
  const { data: recentStudentContacts, loading: studentContactsLoading } = useApi('/student_contacts?page=1&limit=3&sort_by=timestamp&sort_order=desc');

  // Fetch recent records for conversations database
  const { data: recentConversationsUsers, loading: conversationsUsersLoading } = useApi('/conversations/users?page=1&limit=3&sort_by=created_at&sort_order=desc');

  const databases = [
    {
      id: 'resumes',
      name: 'Gigaversity / Resume Data',
      description: 'Gigaversity.in user resumes and contact information',
      color: 'blue',
      icon: Database,
      tables: [
        {
          name: 'Users',
          slug: 'users',
          icon: User,
          description: 'Registered users in the system'
        },
        {
          name: 'Contacts',
          slug: 'contacts',
          icon: MessageSquare,
          description: 'Contact form submissions'
        },
        {
          name: 'Generated Resumes',
          slug: 'generated_resumes',
          icon: Database,
          description: 'Generated resumes'
        }
      ]
    },
    {
      id: 'prescreening',
      name: 'Scholarship / Prescreening Database',
      description: 'Candidate evaluation data',
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
    {
      id: 'conversations',
      name: 'GigaSpace Database',
      description: 'GigaSpace Registered Users data',
      color: 'green',
      icon: MessageCircle,
      tables: [
        {
          name: 'Users',
          slug: 'users',
          icon: User,
          description: 'Registered users in the system'
        }
      ]
    }
  ];

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
          {formatRelativeTime(user.created_at)}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800`}>
          {capitalize(user.auth_method || 'email')}
        </span>
      </div>
    </div>
  );

=======
import { Database, Users, Contact, FileText, Calendar, User, Mail, Phone, Briefcase } from 'lucide-react';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { formatDate, formatRelativeTime, formatPhone, capitalize } from '../utils/formatters';

export const Home = () => {
  const navigate = useNavigate();
  const { data: stats, loading: statsLoading, error: statsError } = useApi('/stats/global');
  
  // Fetch recent records for each table
  const { data: recentUsers, loading: usersLoading } = useApi('/users?page=1&limit=3&sort_by=created_at&sort_order=desc');
  const { data: recentContacts, loading: contactsLoading } = useApi('/contacts?page=1&limit=3&sort_by=created_at&sort_order=desc');
  const { data: recentResumes, loading: resumesLoading } = useApi('/generated_resumes?page=1&limit=3&sort_by=created_at&sort_order=desc');

  const tableStats = [
    {
      name: 'Users',
      count: stats?.total_users || 0,
      icon: Users,
      color: 'blue',
      description: 'Registered users in the system'
    },
    {
      name: 'Contacts',
      count: stats?.total_contacts || 0,
      icon: Contact,
      color: 'green',
      description: 'Contact form submissions'
    },
    {
      name: 'Resumes',
      count: stats?.total_resumes || 0,
      icon: FileText,
      color: 'purple',
      description: 'Generated resumes'
    }
  ];

const renderRecentUser = (user) => (
  <div 
    key={user.id}
    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
    onClick={() => navigate(`/database/users/${user.id}`)}
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
        {formatRelativeTime(user.created_at)}
      </span>
      <span className={`text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800`}>
        {capitalize(user.oauth_provider || user.auth_method || 'email')}
      </span>
    </div>
  </div>
);
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
  const renderRecentContact = (contact) => (
    <div 
      key={contact.id}
      className="p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-colors cursor-pointer"
<<<<<<< HEAD
      onClick={() => navigate(`/database/resumes/contacts/${contact.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
          <MessageSquare className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {contact.name || 'Unnamed Contact'}
=======
      onClick={() => navigate(`/database/contacts/${contact.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
          <Contact className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {contact.full_name || contact.name || 'Unnamed Contact'}
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
          </p>
          <p className="text-xs text-gray-500 truncate">{contact.email}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {formatRelativeTime(contact.created_at)}
        </span>
<<<<<<< HEAD
        {contact.subject && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full truncate max-w-20">
            {contact.subject}
          </span>
        )}
=======
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
          {capitalize(contact.chosen_field || 'Not set')}
        </span>
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
      </div>
    </div>
  );

  const renderRecentResume = (resume) => {
<<<<<<< HEAD
    const experience = resume.experience || 0;
=======
    const experience = resume.resume_data?.experience || 0;
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
    
    return (
      <div 
        key={resume.id}
        className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
<<<<<<< HEAD
        onClick={() => navigate(`/database/resumes/generated_resumes/${resume.id}`)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
            <Database className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              Resume #{resume.id}
=======
        onClick={() => navigate(`/database/resumes/${resume.id}`)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
            <FileText className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {resume.resume_data?.title || 'Untitled Resume'}
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
            </p>
            <p className="text-xs text-gray-500">User {resume.user_id}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {formatRelativeTime(resume.created_at)}
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

<<<<<<< HEAD
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
            {candidate.name || 'Unnamed Candidate'}
          </p>
          <p className="text-xs text-gray-500 truncate">{candidate.email}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {formatRelativeTime(candidate.timestamp)}
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
            {evaluation.candidate_name || 'Evaluation'}
          </p>
          <p className="text-xs text-gray-500">By {evaluation.evaluator_name}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {formatRelativeTime(evaluation.timestamp)}
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
            {question.question_text?.substring(0, 50) || 'Unnamed Question'}...
          </p>
          <p className="text-xs text-gray-500">{question.category || 'No category'}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {formatRelativeTime(question.timestamp)}
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
            {comment.comment_text?.substring(0, 40)}...
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {formatRelativeTime(comment.timestamp)}
        </span>
        {comment.rating && (
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            {comment.rating}★
          </span>
        )}
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
            {feedback.candidate_name || 'Feedback'}
          </p>
          <p className="text-xs text-gray-500">By {feedback.reviewer_name}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {formatRelativeTime(feedback.timestamp)}
        </span>
        {feedback.rating && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            {feedback.rating}★
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
            {contact.name || 'Unnamed Student'}
          </p>
          <p className="text-xs text-gray-500 truncate">{contact.email}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {formatRelativeTime(contact.timestamp)}
        </span>
        {contact.program && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full truncate max-w-20">
            {contact.program}
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
          {formatRelativeTime(user.created_at)}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          user.is_oauth_user ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {user.is_oauth_user ? 'OAuth' : 'Email'}
        </span>
      </div>
    </div>
  );

  const isLoading = statsLoading || usersLoading || contactsLoading || resumesLoading || candidatesLoading || evaluationsLoading || podcastLoading || programCommentsLoading || reviewFeedbacksLoading || studentContactsLoading || conversationsUsersLoading;
=======
  const isLoading = statsLoading || usersLoading || contactsLoading || resumesLoading;
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a

  if (statsError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading statistics</h3>
          <p className="text-red-600 text-sm mt-1">{statsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Database Dashboard
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
<<<<<<< HEAD
          Manage and explore user data, candidates, evaluations, and more across all databases.
        </p>
      </div>

      {/* Database Cards - Showing number of tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {databases.map((database) => (
          <div key={database.id} className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="flex flex-col items-center">
              <div className={`p-4 bg-${database.color}-100 rounded-full mb-4`}>
                <database.icon className={`h-12 w-12 text-${database.color}-600`} />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {database.name}
              </h2>
              
              <p className="text-gray-600 mb-4 max-w-md">
                {database.description}
              </p>

              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  {database.tables.length}
                </span>
                <span className="text-gray-500 ml-2">tables</span>
              </div>
              
              <button
                onClick={() => navigate(`/database/${database.id}`)}
                className={`w-full max-w-xs px-8 py-3 bg-${database.color}-600 hover:bg-${database.color}-700 text-white rounded-lg transition-colors font-medium`}
              >
                Explore Database
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity - Shows ALL recent activity from all databases */}
=======
          Manage and explore user data, contacts, and generated resumes in one centralized platform.
        </p>
      </div>

      {/* Database Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Resume Database
              </h2>
              <p className="text-gray-600">
                Complete database with users, contacts, and resumes
              </p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/database')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Explore Database
          </button>
        </div>

        {/* Table Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            // Loading skeletons for the table stats
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            tableStats.map((table) => (
              <div
                key={table.name}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => navigate(`/database/${table.name.toLowerCase()}`)}
              >
                <div className="flex items-center space-x-3">
                  <table.icon className={`h-8 w-8 text-${table.color}-600`} />
                  <div>
                    <h3 className="font-medium text-gray-900">{table.name}</h3>
                    <p className="text-2xl font-bold text-gray-900">{table.count}</p>
                    <p className="text-sm text-gray-500">{table.description}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Activity
          </h3>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>

<<<<<<< HEAD
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-6 gap-6">
          {/* Recent Users (Resumes) */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <User className="h-4 w-4 text-blue-600" />
=======
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Users */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-4 w-4 text-blue-600" />
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
              <h4 className="font-medium text-gray-900">Recent Users</h4>
            </div>
            <div className="space-y-2">
              {usersLoading ? (
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
              ) : recentUsers?.data?.length > 0 ? (
                recentUsers.data.map(renderRecentUser)
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No users found</p>
              )}
            </div>
            <button
<<<<<<< HEAD
              onClick={() => navigate('/database/resumes/users')}
=======
              onClick={() => navigate('/database/users')}
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
              className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all users →
            </button>
          </div>

          {/* Recent Contacts */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
<<<<<<< HEAD
              <MessageSquare className="h-4 w-4 text-green-600" />
=======
              <Contact className="h-4 w-4 text-green-600" />
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
              <h4 className="font-medium text-gray-900">Recent Contacts</h4>
            </div>
            <div className="space-y-2">
              {contactsLoading ? (
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
              ) : recentContacts?.data?.length > 0 ? (
                recentContacts.data.map(renderRecentContact)
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No contacts found</p>
              )}
            </div>
            <button
<<<<<<< HEAD
              onClick={() => navigate('/database/resumes/contacts')}
=======
              onClick={() => navigate('/database/contacts')}
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
              className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all contacts →
            </button>
          </div>

          {/* Recent Resumes */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
<<<<<<< HEAD
              <Database className="h-4 w-4 text-purple-600" />
=======
              <FileText className="h-4 w-4 text-purple-600" />
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
              <h4 className="font-medium text-gray-900">Recent Resumes</h4>
            </div>
            <div className="space-y-2">
              {resumesLoading ? (
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
              ) : recentResumes?.data?.length > 0 ? (
                recentResumes.data.map(renderRecentResume)
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No resumes found</p>
              )}
            </div>
            <button
<<<<<<< HEAD
              onClick={() => navigate('/database/resumes/generated_resumes')}
=======
              onClick={() => navigate('/database/resumes')}
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
              className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all resumes →
            </button>
          </div>
<<<<<<< HEAD

          {/* Recent Candidates */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <UserCheck className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-gray-900">Recent Candidates</h4>
            </div>
            <div className="space-y-2">
              {candidatesLoading ? (
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
              ) : recentCandidates?.data?.length > 0 ? (
                recentCandidates.data.map(renderRecentCandidate)
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No candidates found</p>
              )}
            </div>
            <button
              onClick={() => navigate('/database/prescreening/candidates')}
              className="w-full mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View all candidates →
            </button>
          </div>

          {/* Recent Evaluations */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-gray-900">Recent Evaluations</h4>
            </div>
            <div className="space-y-2">
              {evaluationsLoading ? (
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
              ) : recentEvaluations?.data?.length > 0 ? (
                recentEvaluations.data.map(renderRecentEvaluation)
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No evaluations found</p>
              )}
            </div>
            <button
              onClick={() => navigate('/database/prescreening/evaluations')}
              className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all evaluations →
            </button>
          </div>

          {/* Recent Conversations Users */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <User className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-gray-900">Recent Chat Users</h4>
            </div>
            <div className="space-y-2">
              {conversationsUsersLoading ? (
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
              ) : recentConversationsUsers?.data?.length > 0 ? (
                recentConversationsUsers.data.map(renderRecentConversationsUser)
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No users found</p>
              )}
            </div>
            <button
              onClick={() => navigate('/database/conversations/users')}
              className="w-full mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View all chat users →
            </button>
          </div>
=======
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
        </div>
      </div>
    </div>
  );
};