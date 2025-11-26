import Company from "./company.model.js";

// Create a new company
export const createCompany = async (req, res) => {
  try {
    const { name, industry, size, country, website, logo, description, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const company = new Company({
      name,
      industry,
      size,
      country,
      website,
      logo,
      description,
      address,
    });

    await company.save();

    res.status(201).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all companies (with pagination)
export const getAllCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const companies = await Company.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Company.countDocuments();

    res.json({
      success: true,
      companies,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get company by ID
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update company
export const updateCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    const { name, industry, size, country, website, logo, description, address } = req.body;

    const company = await Company.findByIdAndUpdate(
      companyId,
      { name, industry, size, country, website, logo, description, address },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete company
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ success: true, message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search companies by name or industry
export const searchCompanies = async (req, res) => {
  try {
    const query = req.query.q || "";
    const limit = parseInt(req.query.limit) || 10;

    const companies = await Company.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { industry: { $regex: query, $options: "i" } },
      ],
    })
      .limit(limit);

    res.json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
