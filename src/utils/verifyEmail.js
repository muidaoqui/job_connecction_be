export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    if (user.otpCode !== otp) return res.status(400).json({ message: "Mã OTP sai" });
    if (user.otpExpire < Date.now()) return res.status(400).json({ message: "Mã OTP đã hết hạn" });

    user.emailVerified = true;
    user.otpCode = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.status(200).json({ message: "Xác minh email thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xác minh OTP" });
  }
};
