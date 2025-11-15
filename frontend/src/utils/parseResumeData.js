export const parseResumeData = (resumeData) => {
  if (!resumeData || typeof resumeData !== 'object') {
    return {
      summary: '',
      skills: [],
      experience: 0,
      title: '',
      education: [],
      workExperience: []
    };
  }

  // Handle both stringified JSON and object
  let data;
  if (typeof resumeData === 'string') {
    try {
      data = JSON.parse(resumeData);
    } catch {
      data = {};
    }
  } else {
    data = resumeData;
  }

  return {
    summary: data.summary || data.profile_summary || '',
    skills: Array.isArray(data.skills) ? data.skills : 
            typeof data.skills === 'string' ? data.skills.split(',').map(s => s.trim()) : [],
    experience: data.experience || data.years_experience || 0,
    title: data.title || data.job_title || '',
    education: Array.isArray(data.education) ? data.education : [],
    workExperience: Array.isArray(data.work_experience) ? data.work_experience : 
                   Array.isArray(data.experience_history) ? data.experience_history : []
  };
};

export const extractSkills = (resumeData, maxSkills = 5) => {
  const parsed = parseResumeData(resumeData);
  return parsed.skills.slice(0, maxSkills);
};

export const extractSummary = (resumeData, maxLength = 120) => {
  const parsed = parseResumeData(resumeData);
  if (!parsed.summary) return 'No summary available';
  
  if (parsed.summary.length <= maxLength) return parsed.summary;
  
  return parsed.summary.substring(0, maxLength) + '...';
};

export const extractExperience = (resumeData) => {
  const parsed = parseResumeData(resumeData);
  return parsed.experience || 0;
};
