import Company from "./company.model.js";

export const createOrUpdateCompany = async (req, res) => {
  try {
    const userId = req.user._id;

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

    let company = await Company.findOne({ userId });

    if (!company) {
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
    } else {
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
        company.galleryImages = [
          ...company.galleryImages,
          ...galleryImages,
        ];

      await company.save();
    }

    res.status(200).json({
      success: true,
      message: "Lưu hồ sơ công ty thành công!",
      data: company,
    });
  } catch (error) {
    console.error("Company Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lưu hồ sơ công ty",
    });
  }
};

export const getCompanyByUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const company = await Company.findOne({ userId });

    res.status(200).json({
      success: true,
      data: company || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
