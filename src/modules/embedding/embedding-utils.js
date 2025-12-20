// Kiểm tra xem các trường ảnh hưởng đến embedding có thay đổi không
export const hasJobEmbeddingFieldsChanged = (modifiedPaths) => {
    const embeddingFields = ['title', 'description', 'requirements', 'location', 'salary', 'jobType'];
    return modifiedPaths.some(path => embeddingFields.includes(path));
};

export const hasCandidateEmbeddingFieldsChanged = (modifiedPaths) => {
    const embeddingFields = ['dateOfBirth', 'gender', 'address', 'profileSummary'];
    return modifiedPaths.some(path => embeddingFields.includes(path));
};