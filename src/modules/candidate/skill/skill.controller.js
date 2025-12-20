import Skill from "./skill.model.js";
import Candidate from "../candidate.model.js";
import { generateAndSaveCandidateEmbedding } from "../../embedding/embedding.serivice.js";

// Create skill
export const createSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skillName, proficiency } = req.body;

    if (!skillName || typeof skillName !== "string") {
      return res.status(400).json({ message: "skillName is required" });
    }

    const skill = new Skill({
      userId,
      skillName: skillName.trim(),
      proficiency: proficiency || "beginner",
    });

    await skill.save();

    // Try to update candidate embedding (silent fail)
    try {
      // Candidate._id is userId in your schema
      await generateAndSaveCandidateEmbedding(userId.toString());
    } catch (err) {
      console.error(
        "Failed to regenerate candidate embedding after createSkill:",
        err.message
      );
    }

    return res.status(201).json(skill);
  } catch (error) {
    console.error("Create skill error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get skills for logged-in user
export const getSkills = async (req, res) => {
  try {
    const userId = req.user.id;
    const skills = await Skill.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json(skills);
  } catch (error) {
    console.error("Get skills error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update skill (only owner)
export const updateSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const update = req.body;

    const skill = await Skill.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true }
    ).lean();
    if (!skill) return res.status(404).json({ message: "Skill not found" });

    try {
      await generateAndSaveCandidateEmbedding(userId.toString());
    } catch (err) {
      console.error(err.message);
    }

    return res.status(200).json(skill);
  } catch (error) {
    console.error("Update skill error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete skill (only owner)
export const deleteSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const skill = await Skill.findOneAndDelete({ _id: id, userId });
    if (!skill) return res.status(404).json({ message: "Skill not found" });

    try {
      await generateAndSaveCandidateEmbedding(userId.toString());
    } catch (err) {
      console.error(err.message);
    }

    return res.status(200).json({ message: "Skill deleted" });
  } catch (error) {
    console.error("Delete skill error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Endorse skill (increment endorsements) - optional
export const endorseSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const skill = await Skill.findByIdAndUpdate(
      id,
      { $inc: { endorsements: 1 } },
      { new: true }
    ).lean();
    if (!skill) return res.status(404).json({ message: "Skill not found" });
    return res.status(200).json(skill);
  } catch (error) {
    console.error("Endorse skill error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
