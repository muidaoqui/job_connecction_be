import Company from "./company.model.js";
import Recruiter from "../recruiter.model.js";
export const createOrUpdateCompany = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🔥 1. Kiểm tra profile recruiter
    const recruiter = await Recruiter.findOne({ userId });

    if (!recruiter) {
      return res.status(403).json({
        success: false,
        message: "Bạn cần tạo hồ sơ Nhà tuyển dụng trước",
      });
    }

    // Lấy dữ liệu gửi lên
    const {
      name,
      tagline,
      website,
      size,
      country,
      industry,
      techs,
      socialLinks,
      description,
    } = req.body;

    // Convert string -> array
    const techArray = JSON.parse(techs);
    const linksArray = JSON.parse(socialLinks);

    // FILES
    const files = req.files;

    const logo = files.logo?.[0]
      ? `/uploads/company/logo/${files.logo[0].filename}`
      : null;

    const coverImage = files.coverImage?.[0]
      ? `/uploads/company/cover/${files.coverImage[0].filename}`
      : null;

    const businessLicense = files.businessLicense?.[0]
      ? `/uploads/company/license/${files.businessLicense[0].filename}`
      : null;

    let galleryImages = [];
    if (files.galleryImages) {
      galleryImages = files.galleryImages.map(
        (f) => `/uploads/company/gallery/${f.filename}`
      );
    }

    let company;

    // 🔥 2. Nếu recruiter đã có company → update
    if (recruiter.companyId) {
      company = await Company.findById(recruiter.companyId);

      if (!company)
        return res.status(404).json({ message: "Không tìm thấy công ty" });

      company.name = name;
      company.tagline = tagline;
      company.website = website;
      company.size = size;
      company.country = country;
      company.industry = industry;
      company.techs = techArray;
      company.socialLinks = linksArray;
      company.description = description;

      if (logo) company.logo = logo;
      if (coverImage) company.coverImage = coverImage;
      if (businessLicense) company.businessLicense = businessLicense;
      if (galleryImages.length > 0)
        company.galleryImages = [...company.galleryImages, ...galleryImages];

      await company.save();
    } 
    // 🔥 3. Nếu recruiter chưa có company → tạo mới
    else {
      company = await Company.create({
        userId,
        name,
        tagline,
        website,
        size,
        country,
        industry,
        techs: techArray,
        socialLinks: linksArray,
        description,
        logo,
        coverImage,
        galleryImages,
        businessLicense,
      });

      // 🔥 Gán companyId cho recruiter
      recruiter.companyId = company._id;
      await recruiter.save();
    }

    return res.status(200).json({
      success: true,
      message: "Lưu thông tin công ty thành công!",
      data: company,
    });
  } catch (error) {
    console.error("Company Error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lưu hồ sơ công ty",
    });
  }
};
export const getCompanyByUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const company = await Company.findOne({ userId });

    return res.status(200).json({
      success: true,
      data: company || null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin công ty",
    });
  }
};
export const getCompanyList = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const companies = await Company.find()
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};