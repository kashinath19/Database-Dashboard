
import { useApi } from '../hooks/useApi';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate, formatDateTime, formatPhone, capitalize, formatRelativeTime, formatExperience } from '../utils/formatters';
import { parseResumeData } from '../utils/parseResumeData';
import { getRecordEndpoint, getTableEndpoint } from '../utils/api';
import { User, Mail, Phone, Calendar, MapPin, Star, MessageCircle, Users, FileText, Link, Award, GraduationCap, Briefcase, Code, BookOpen, ExternalLink } from 'lucide-react';

export const RecordDetail = () => {
  const { database, table, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Use record data from location state if available (passed from TableView)
  const recordFromState = location.state?.recordData;

  // Update endpoint calculation to handle all databases
  let endpoint;
  if (database === 'conversations') {
    endpoint = `/conversations/${table}/${id}`;
  } else {
    endpoint = getRecordEndpoint(database, table, id);
  }

  const { data: record, loading, error } = useApi(endpoint, !recordFromState);

  // Use record from state if available, otherwise use API data
  const currentRecord = recordFromState || record;

  // State to check if user has related resumes
  const [hasRelatedResumes, setHasRelatedResumes] = useState(null);
  const [relatedResumesCount, setRelatedResumesCount] = useState(0);
  const [checkingResumes, setCheckingResumes] = useState(false);

  // NEW: Function to get properly formatted table names
  const getTableName = (table) => {
    const tableNames = {
      // Database 1: Resumes
      'users': 'Resume Users',
      'contacts': 'Contact Submissions',
      'generated_resumes': 'Generated Resumes',
      
      // Database 2: Prescreening
      'candidates': 'Candidates',
      'evaluations': 'Evaluations',
      'podcast_questions': 'Podcast Questions',
      'program_comments': 'Program Comments',
      'program_stats': 'Program Statistics',
      'review_feedbacks': 'Review Feedbacks',
      'student_contacts': 'Student Contacts',
      
      // Database 3: Conversations
      'users': 'GigaSpace Users',
     // 'conversations': 'Conversations'//,
    //  'messages': 'Messages',
     // 'conversation_participants': 'Conversation Participants'
    };

    return tableNames[table] || capitalize(table?.replace(/_/g, ' '));
  };

  // FIXED: Check if user has any generated resumes - using correct API endpoint
  useEffect(() => {
    if (!(database === 'resumes' && table === 'users' && currentRecord?.id)) return;

    const checkRelatedResumes = async () => {
      setCheckingResumes(true);
      try {
        // prefer explicit backend URL from env
        const API_HOST = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
        const path = `/generated_resumes?filter_user_id=${currentRecord.id}&limit=1`;
        const url = API_HOST ? `${API_HOST}${path}` : path;

        console.log('Checking related resumes URL:', url);

        const resp = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' }
        });

        if (!resp.ok) {
          console.error('HTTP error checking resumes', resp.status, resp.statusText);
          setHasRelatedResumes(null);
          setRelatedResumesCount(0);
          return;
        }

        const ct = resp.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const text = await resp.text();
          console.error('Non-JSON response received:', text.slice(0, 400));
          setHasRelatedResumes(null);
          setRelatedResumesCount(0);
          return;
        }

        const json = await resp.json();
        const found = (json?.data && json.data.length > 0) || (json?.count && json.count > 0);
        setHasRelatedResumes(Boolean(found));
        const count = json?.pagination?.total_records ?? json?.count ?? (json?.data?.length ?? 0);
        setRelatedResumesCount(Number(count));
      } catch (err) {
        console.error('Error checking related resumes:', err);
        setHasRelatedResumes(null);
        setRelatedResumesCount(0);
      } finally {
        setCheckingResumes(false);
      }
    };

    checkRelatedResumes();
  }, [database, table, currentRecord?.id]);

  if (loading && !recordFromState) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">

export const RecordDetail = () => {
  const { table, id } = useParams();
  const navigate = useNavigate();

  // Map table names to API endpoints
  const getEndpoint = () => {
    switch (table) {
      case 'users':
        return `/users/${id}`;
      case 'contacts':
        return `/contacts/${id}`;
      case 'resumes':
        return `/generated_resumes/${id}`;
      default:
        return null;
    }
  };

  const { data: record, loading, error } = useApi(getEndpoint());

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingSkeleton type="card" count={1} />
      </div>
    );
  }

  if (error && !recordFromState) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <EmptyState
          type="data"
          title="Record not found"
          message="The requested record could not be loaded."
          action={
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Go Back
            </button>
          }
        />
      </div>
    );
  }

  if (!currentRecord) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <EmptyState
          type="data"
          title="No data available"
          message="This record doesn't exist or has been deleted."
          action={
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
          }
        />
      </div>
    );
  }

  // Enhanced resume data parser with better formatting and filtering
  const parseEnhancedResumeData = (resumeData) => {
    try {
      const data = typeof resumeData === 'string' ? JSON.parse(resumeData) : resumeData;
      
      // Calculate actual experience from work experience
      const calculateExperience = (workExperience) => {
        if (!workExperience || !Array.isArray(workExperience)) return 0;
        
        let totalMonths = 0;
        workExperience.forEach(job => {
          if (job.duration) {
            // Parse duration like "2 years 3 months" or "1 year"
            const yearsMatch = job.duration.match(/(\d+)\s*year/);
            const monthsMatch = job.duration.match(/(\d+)\s*month/);
            
            const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;
            const months = monthsMatch ? parseInt(monthsMatch[1]) : 0;
            
            totalMonths += (years * 12) + months;
          }
        });
        
        return Math.round(totalMonths / 12); // Convert to years
      };

      // Filter out empty arrays and objects
      const workExperience = (data?.workExperience || []).filter(work => 
        work && (work.position || work.companyName) && work.position !== '' && work.companyName !== ''
      );

      const actualExperience = calculateExperience(workExperience);
      
      const filteredData = {
        personalInfo: {
          name: data?.header?.name || data?.name || 'Not provided',
          email: data?.header?.email || data?.email || 'Not provided',
          phone: data?.header?.phone || data?.phone || 'Not provided',
          github: data?.header?.github || data?.github || '',
          linkedin: data?.header?.linkedin || data?.linkedin || '',
          portfolio: data?.header?.portfolio || data?.portfolio || ''
        },
        summary: data?.summary || '',
        skills: (data?.skills || []).filter(skill => skill && skill.trim() !== ''),
        experience: data?.experience || actualExperience, // Use calculated experience if no explicit experience field
        calculatedExperience: actualExperience,
        education: (data?.education || []).filter(edu => 
          edu && (edu.degree || edu.institution) && edu.degree !== '[specific major placeholder]' && edu.institution !== '[Institution Name Placeholder]'
        ),
        workExperience: workExperience,
        projects: (data?.projects || []).filter(project => 
          project && project.name && project.name.trim() !== '' && !project.name.includes('[placeholder]')
        ),
        certifications: (data?.certifications || []).filter(cert => 
          cert && cert.name && cert.name.trim() !== ''
        ),
        aiExperience: (data?.aiExperience || []).filter(ai => 
          ai && ai.toolName && ai.toolName.trim() !== ''
        ),
        rawData: data
      };

      // Clean up personal info - remove empty fields
      Object.keys(filteredData.personalInfo).forEach(key => {
        if (!filteredData.personalInfo[key] || filteredData.personalInfo[key] === 'Not provided') {
          delete filteredData.personalInfo[key];
        }
      });

      return filteredData;
    } catch (e) {
      return {
        personalInfo: { name: 'Error parsing resume', email: '', phone: '' },
        summary: '',
        skills: [],
        experience: 0,
        calculatedExperience: 0,
        education: [],
        workExperience: [],
        projects: [],
        certifications: [],
        aiExperience: [],
        rawData: resumeData
      };
    }
  };

  // Navigation handlers for related records
  const handleNavigateToUser = (userId) => {
    navigate(`/database/resumes/users/${userId}`);
  };

  const handleNavigateToCandidate = (candidateId) => {
    navigate(`/database/prescreening/candidates/${candidateId}`);
  };

  const handleNavigateToEvaluation = (evaluationId) => {
    navigate(`/database/prescreening/evaluations/${evaluationId}`);
  };

  const handleNavigateToConversation = (conversationId) => {
    navigate(`/database/conversations/conversations/${conversationId}`);
  };

  const handleNavigateToConversationsUser = (userId) => {
    navigate(`/database/conversations/users/${userId}`);
  };

  // NEW: Proper navigation handler for user resumes with filter
  const handleNavigateToUserResumes = (userId) => {
    navigate(`/database/resumes/generated_resumes?filter_user_id=${userId}`);
  };

  const getDatabaseName = () => {
    switch (database) {
      case 'resumes':
        return 'Gigaversity / Resume Data';
      case 'prescreening':
        return 'Scholarship / Prescreening Database';
      case 'conversations':
        return 'GigaSpace Database';
      default:
        return 'Database';
    }
  };

  const getDatabaseColor = () => {
    switch (database) {
      case 'resumes':
        return 'blue';
      case 'prescreening':
        return 'purple';
      case 'conversations':
        return 'green';
      default:
        return 'gray';
    }
  };

  const renderUserDetail = () => {
    const isConversationsUser = database === 'conversations';
  const renderUserDetail = () => {
    if (!record) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentRecord.name || currentRecord.username || 'Unnamed User'}
              </h1>
              <p className="text-gray-600">User ID: {currentRecord.id}</p>
              {currentRecord.username && (
                <p className="text-gray-500">Username: {currentRecord.username}</p>
              )}
            </div>
            {currentRecord.is_oauth_user && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                External Login
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {record.name || 'Unnamed User'}
          </h1>
          <p className="text-gray-600">User ID: {record.id}</p>
        </div>

        <div className="p-6">
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Email Address</label>
                  <p className="text-gray-900">{currentRecord.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="text-gray-900">{formatPhone(currentRecord.phone || currentRecord.mobile_number) || 'Not provided'}</p>
                </div>
              </div>
              {currentRecord.oauth_provider && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Login Method</label>
                  <p className="text-gray-900">Signed in with {capitalize(currentRecord.oauth_provider)}</p>
                </div>
              )}
              {currentRecord.oauth_id && (
                <div>
                  <label className="text-sm font-medium text-gray-500">External Account ID</label>
                  <p className="text-gray-900 font-mono text-sm">{currentRecord.oauth_id}</p>
                </div>
              )}
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{record.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{formatPhone(record.phone)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Auth Method</label>
                <p className="text-gray-900">{capitalize(record.oauth_provider || record.auth_method || 'email')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">OAuth ID</label>
                <p className="text-gray-900">{record.oauth_id || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Activity Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Activity Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account Created</label>
                <p className="text-gray-900">{formatDateTime(currentRecord.created_at)}</p>
                <p className="text-gray-500 text-sm">{formatRelativeTime(currentRecord.created_at)}</p>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-gray-900">{formatDateTime(record.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Login</label>
                <p className="text-gray-900">
                  {currentRecord.last_login ? formatDateTime(currentRecord.last_login) : 'Never logged in'}
                </p>
                {currentRecord.last_login && (
                  <p className="text-gray-500 text-sm">{formatRelativeTime(currentRecord.last_login)}</p>
                )}
              </div>
              {currentRecord.registration_ip && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Registration Location</label>
                  <p className="text-gray-900 font-mono text-sm">{currentRecord.registration_ip}</p>
                </div>
              )}
              {currentRecord.last_login_ip && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Login Location</label>
                  <p className="text-gray-900 font-mono text-sm">{currentRecord.last_login_ip}</p>
                </div>
              )}
            </div>
          </div>

          {/* Related Data - UPDATED with better resume checking */}
          {database === 'resumes' && currentRecord.id && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Information</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Generated Resumes</h3>
                    <p className="text-sm text-gray-600">
                      {checkingResumes 
                        ? 'Checking for resumes...'
                        : hasRelatedResumes === null 
                          ? 'Unable to check resumes'
                          : hasRelatedResumes 
                            ? `This user has created ${relatedResumesCount} resume(s)`
                            : 'No resumes found for this user'
                      }
                    </p>
                  </div>
                  {hasRelatedResumes ? (
                    <button
                      onClick={() => handleNavigateToUserResumes(currentRecord.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View Resumes</span>
                    </button>
                  ) : !checkingResumes && (
                    <span className="text-sm text-gray-500 px-3 py-2 bg-gray-200 rounded">
                      {hasRelatedResumes === null ? 'Check failed' : 'No resumes available'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
                  {record.last_login ? formatRelativeTime(record.last_login) : 'Never logged in'}
                </p>
              </div>
            </div>
          </div>

          {/* Related Data */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Data</h2>
            <button
              onClick={() => navigate(`/database/resumes?user_id=${record.id}`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              View User's Resumes
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContactDetail = () => {
    if (!record) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900">
            {record.full_name || record.name || 'Unnamed Contact'}
          </h1>
          <p className="text-gray-600">Contact ID: {record.id}</p>
        </div>

        <div className="p-6">
          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-gray-900">{record.full_name || record.name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{record.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{formatPhone(record.phone_number || record.phone)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Chosen Field</label>
                <p className="text-gray-900">{capitalize(record.chosen_field || 'Not set')}</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-gray-900">{formatDateTime(record.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResumeDetail = () => {
    const parsedData = parseEnhancedResumeData(currentRecord.resume_data);
    const experience = parsedData.experience || 0;
    const hasCalculatedExperience = parsedData.calculatedExperience > 0 && parsedData.calculatedExperience !== experience;

    // Check which sections have actual data
    const hasPersonalInfo = Object.keys(parsedData.personalInfo).length > 0 && 
      (parsedData.personalInfo.name !== 'Error parsing resume');
    const hasSummary = parsedData.summary && parsedData.summary.trim() !== '';
    const hasSkills = parsedData.skills.length > 0;
    const hasEducation = parsedData.education.length > 0;
    const hasWorkExperience = parsedData.workExperience.length > 0;
    const hasProjects = parsedData.projects.length > 0;
    const hasCertifications = parsedData.certifications.length > 0;
    const hasAiExperience = parsedData.aiExperience.length > 0;
    if (!record) return null;

    const parsedData = parseResumeData(record.resume_data);
    // Get experience from resume_data JSON (actual values: 6, 2, 4, 3, 5)
    const experience = parsedData.experience || 0;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Resume #{currentRecord.id}
              </h1>
              <p className="text-gray-600">Resume ID: {currentRecord.id}</p>
              {parsedData.personalInfo.name && parsedData.personalInfo.name !== 'Not provided' && (
                <p className="text-gray-700">Created for: {parsedData.personalInfo.name}</p>
              )}
            </div>
            {(experience > 0 || hasCalculatedExperience) && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 rounded-full text-orange-800">
                <Briefcase className="h-4 w-4" />
                <span className="font-medium">
                  {hasCalculatedExperience ? formatExperience(parsedData.calculatedExperience) : formatExperience(experience)}
                  {hasCalculatedExperience && " (calculated)"}
                </span>
                {parsedData.title || 'Untitled Resume'}
              </h1>
              <p className="text-gray-600">Resume ID: {record.id}</p>
            </div>
            {experience > 0 && (
              <div className="flex items-center space-x-1 px-3 py-1 bg-orange-100 rounded-full text-orange-800">
                <span className="font-medium">{formatExperience(experience)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created By</label>
                {currentRecord.user_id ? (
                  <button
                    onClick={() => handleNavigateToUser(currentRecord.user_id)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <User className="h-4 w-4" />
                    <span>View User #{currentRecord.user_id}</span>
                  </button>
                ) : (
                  <p className="text-gray-900">Not associated with a user</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-gray-900">{formatDateTime(currentRecord.created_at)}</p>
                <p className="text-gray-500 text-sm">{formatRelativeTime(currentRecord.created_at)}</p>
              </div>
              {(experience > 0 || hasCalculatedExperience) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Experience Level</label>
                  <p className="text-gray-900">
                    {hasCalculatedExperience ? formatExperience(parsedData.calculatedExperience) : formatExperience(experience)}
                    {hasCalculatedExperience && " (calculated from work experience)"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Personal Information from Resume */}
          {hasPersonalInfo && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedData.personalInfo.name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{parsedData.personalInfo.name}</p>
                  </div>
                )}
                {parsedData.personalInfo.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{parsedData.personalInfo.email}</p>
                  </div>
                )}
                {parsedData.personalInfo.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{formatPhone(parsedData.personalInfo.phone)}</p>
                  </div>
                )}
                {parsedData.personalInfo.github && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">GitHub</label>
                    <p className="text-gray-900">{parsedData.personalInfo.github}</p>
                  </div>
                )}
                {parsedData.personalInfo.linkedin && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">LinkedIn</label>
                    <p className="text-gray-900">{parsedData.personalInfo.linkedin}</p>
                  </div>
                )}
                {parsedData.personalInfo.portfolio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Portfolio</label>
                    <p className="text-gray-900">{parsedData.personalInfo.portfolio}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Professional Summary */}
          {hasSummary && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Summary</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{parsedData.summary}</p>
              </div>
                <label className="text-sm font-medium text-gray-500">User ID</label>
                <button
                  onClick={() => navigate(`/database/users/${record.user_id}`)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  View User {record.user_id}
                </button>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-gray-900">{formatDateTime(record.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Experience</label>
                <p className="text-gray-900">{formatExperience(experience)}</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          {parsedData.summary && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
              <p className="text-gray-700 leading-relaxed">{parsedData.summary}</p>
            </div>
          )}

          {/* Skills */}
          {hasSkills && (
          {parsedData.skills && parsedData.skills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {parsedData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {hasEducation && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="h-5 w-5 mr-2" />
                Education
              </h2>
              <div className="space-y-4">
                {parsedData.education.map((edu, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="font-medium text-gray-900">{edu.degree}</h3>
                    <p className="text-gray-600">{edu.institution}</p>
                    {edu.graduationYear && (
                      <p className="text-gray-500 text-sm">Graduated: {edu.graduationYear}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {hasWorkExperience && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Work Experience
              </h2>
              <div className="space-y-4">
                {parsedData.workExperience.map((work, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                    <h3 className="font-medium text-gray-900">{work.position}</h3>
                    <p className="text-gray-600">{work.companyName}</p>
                    {work.duration && (
                      <p className="text-gray-500 text-sm">{work.duration}</p>
                    )}
                    {work.responsibilities && work.responsibilities.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {work.responsibilities.map((resp, respIndex) => (
                          <li key={respIndex} className="text-gray-700 text-sm">• {resp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {hasProjects && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Code className="h-5 w-5 mr-2" />
                Projects
              </h2>
              <div className="space-y-4">
                {parsedData.projects.map((project, index) => (
                  <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    {project.responsibilities && project.responsibilities.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {project.responsibilities.map((resp, respIndex) => (
                          <li key={respIndex} className="text-gray-700 text-sm">• {resp}</li>
                        ))}
                      </ul>
                    )}
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
                        View Project
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {hasCertifications && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Certifications
              </h2>
              <div className="space-y-2">
                {parsedData.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="font-medium text-gray-900">{cert.name}</p>
                      {cert.issuer && (
                        <p className="text-gray-600 text-sm">Issued by: {cert.issuer}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Experience */}
          {hasAiExperience && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                AI Tools Experience
              </h2>
              <div className="space-y-4">
                {parsedData.aiExperience.map((ai, index) => (
                  <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2">
                    <h3 className="font-medium text-gray-900">{ai.toolName}</h3>
                    {ai.usageCases && ai.usageCases.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Usage:</p>
                        <ul className="mt-1 space-y-1">
                          {ai.usageCases.map((useCase, useIndex) => (
                            <li key={useIndex} className="text-gray-600 text-sm">• {useCase}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {ai.impact && (
                      <p className="text-gray-700 text-sm mt-2">
                        <span className="font-medium">Impact:</span> {ai.impact}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Data (Collapsible) */}
          <div className="mb-8">
            <details className="group">
              <summary className="cursor-pointer list-none">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 inline-flex items-center">
                  <span>Raw Resume Data</span>
                  <span className="ml-2 text-blue-600 group-open:hidden">(Click to expand)</span>
                  <span className="ml-2 text-blue-600 hidden group-open:inline">(Click to collapse)</span>
                </h2>
              </summary>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm max-h-96 mt-2">
                {JSON.stringify(parsedData.rawData, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  };

  const renderCandidateDetail = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentRecord.name || 'Unnamed Candidate'}
              </h1>
              <p className="text-gray-600">Candidate ID: {currentRecord.id}</p>
              {currentRecord.email && (
                <p className="text-gray-500">Email: {currentRecord.email}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidate Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{currentRecord.name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{currentRecord.email || 'Not provided'}</p>
              </div>
              {currentRecord.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{formatPhone(currentRecord.phone)}</p>
                </div>
              )}
              {currentRecord.timestamp && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">{formatDateTime(currentRecord.timestamp)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Related Data */}
          {currentRecord.id && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Information</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(`/database/${database}/evaluations?filter_candidate_id=${currentRecord.id}`)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>View Evaluations for This Candidate</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEvaluationDetail = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Evaluation #{currentRecord.id}
              </h1>
              <p className="text-gray-600">Evaluation ID: {currentRecord.id}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Evaluation Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Candidate</label>
                {currentRecord.candidate_id ? (
                  <button
                    onClick={() => handleNavigateToCandidate(currentRecord.candidate_id)}
                    className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <User className="h-4 w-4" />
                    <span>View Candidate #{currentRecord.candidate_id}</span>
                  </button>
                ) : (
                  <p className="text-gray-900">Not associated with a candidate</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Score</label>
                <p className="text-gray-900">{currentRecord.total_score || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Decision</label>
                <p className="text-gray-900">{currentRecord.decision || 'N/A'}</p>
              </div>
              {currentRecord.timestamp && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">{formatDateTime(currentRecord.timestamp)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContactDetail = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentRecord.name || 'Unnamed Contact'}
              </h1>
              <p className="text-gray-600">Contact ID: {currentRecord.id}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{currentRecord.name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{currentRecord.email || 'Not provided'}</p>
              </div>
              {currentRecord.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{formatPhone(currentRecord.phone)}</p>
                </div>
              )}
              {currentRecord.subject && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Subject</label>
                  <p className="text-gray-900">{currentRecord.subject}</p>
                </div>
              )}
              {currentRecord.created_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">{formatDateTime(currentRecord.created_at)}</p>
                </div>
              )}
            </div>
          </div>

          {currentRecord.message && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Message</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{currentRecord.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGenericDetail = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentRecord.name || currentRecord.title || `Record ${currentRecord.id}`}
              </h1>
              <p className="text-gray-600">{getTableName(table)} ID: {currentRecord.id}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(currentRecord).map(([key, value]) => (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-500 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <p className="text-gray-900 break-words">
                    {value === null || value === undefined 
                      ? '-' 
                      : typeof value === 'object' 
                        ? JSON.stringify(value, null, 2)
                        : String(value)
                    }
                  </p>
                </div>
              ))}
            </div>
          {/* Raw Data */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Raw Data</h2>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm max-h-96">
              {JSON.stringify(record, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!currentRecord) return null;

    // Database 1: Resumes
    if (database === 'resumes') {
      switch (table) {
        case 'users':
          return renderUserDetail();
        case 'contacts':
          return renderContactDetail();
        case 'generated_resumes':
          return renderResumeDetail();
        default:
          return renderGenericDetail();
      }
    }

    // Database 2: Prescreening
    if (database === 'prescreening') {
      switch (table) {
        case 'candidates':
          return renderCandidateDetail();
        case 'evaluations':
          return renderEvaluationDetail();
        case 'podcast_questions':
        case 'program_comments':
        case 'program_stats':
        case 'review_feedbacks':
        case 'student_contacts':
          return renderGenericDetail();
        default:
          return renderGenericDetail();
      }
    }

    // Database 3: Conversations
    if (database === 'conversations') {
      switch (table) {
        case 'users':
          return renderUserDetail();
        case 'conversations':
        case 'messages':
        case 'conversation_participants':
          return renderGenericDetail();
        default:
          return renderGenericDetail();
      }
    }

    return renderGenericDetail();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
    switch (table) {
      case 'users':
        return renderUserDetail();
      case 'contacts':
        return renderContactDetail();
      case 'resumes':
        return renderResumeDetail();
      default:
        return (
          <EmptyState
            type="data"
            title="Unknown Table"
            message={`Table "${table}" is not supported.`}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb 
        items={[
          { label: 'Home', href: '/' },
          { label: 'Database', href: '/database' },

          { label: `Record ${id}`, href: null }
        ]} 
      />

      {/* Database Indicator */}
      <div className="flex items-center space-x-2 mb-6">
        <div className={`w-3 h-3 rounded-full bg-${getDatabaseColor()}-500`}></div>
        <span className={`text-sm font-medium text-${getDatabaseColor()}-600`}>
          {getDatabaseName()}
        </span>
      </div>

      {renderContent()}

      {/* Navigation Buttons */}
      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={() => navigate(`/database/${database}/${table}`)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <span>View All {getTableName(table)}</span>
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => navigate(`/database/${table}`)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          View All {capitalize(table)}
        </button>
      </div>
    </div>
  );
};

export default RecordDetail;
