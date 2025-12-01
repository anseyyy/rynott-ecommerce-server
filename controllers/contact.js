const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");
const Contact = require("../models/Contact");

// Configure nodemailer transporter
const createTransporter = () => {
  // For development, you can use Ethereal for testing emails
  if (process.env.NODE_ENV === "development") {
    return nodemailer.createTestAccount().then((testAccount) => {
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    });
  }

  // For production, use the configured email service
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Contact form submission handler
const submitContactForm = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, phone, subject, message } = req.body;

    // Save to database
    const contact = await Contact.create({
      name,
      email,
      phone: phone || "",
      subject,
      message,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
      status: "new",
    });

    // Create email content
    const emailSubject = `New Contact Form Submission: ${subject}`;
    const emailContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0;">
        ${message.replace(/\n/g, "<br>")}
      </div>
      <hr>
      <p><small>Submitted at: ${new Date().toISOString()}</small></p>
      <p><small>IP Address: ${
        req.ip || req.connection.remoteAddress
      }</small></p>
    `;

    // Create email transporter
    const transporter = await createTransporter();

    // Send email to support team
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@rynott.com",
      to: process.env.SUPPORT_EMAIL || "support@rynott.com",
      replyTo: email,
      subject: emailSubject,
      html: emailContent,
    };

    const info = await transporter.sendMail(mailOptions);

    // Send confirmation email to user
    const confirmationContent = `
      <h2>Thank you for contacting Rynott!</h2>
      <p>Dear ${name},</p>
      <p>Thank you for reaching out to us. We have received your message and will get back to you within 24 hours.</p>
      
      <h3>Your message details:</h3>
      <ul>
        <li><strong>Subject:</strong> ${subject}</li>
        <li><strong>Submitted:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      
      <h3>Your message:</h3>
      <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0;">
        ${message.replace(/\n/g, "<br>")}
      </div>
      
      <p>If you have any urgent matters, please feel free to call us at <strong>+1 (555) 123-4567</strong>.</p>
      
      <p>Best regards,<br>The Rynott Team</p>
      
      <hr>
      <p><small>This is an automated message. Please do not reply to this email.</small></p>
    `;

    const confirmationOptions = {
      from: process.env.EMAIL_FROM || "noreply@rynott.com",
      to: email,
      subject: "Thank you for contacting Rynott - We received your message",
      html: confirmationContent,
    };

    await transporter.sendMail(confirmationOptions);

    // Log email details in development
    if (process.env.NODE_ENV === "development") {
      console.log("Contact form email sent:", info.messageId);
      console.log("Preview URL: ", nodemailer.getTestMessageUrl(info));
    }

    res.status(201).json({
      success: true,
      message:
        "Your message has been sent successfully! We'll get back to you soon.",
      data: {
        id: contact._id,
        messageId: info.messageId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Contact form submission error:", error);
    res.status(500).json({
      success: false,
      message:
        "Sorry, there was an error sending your message. Please try again or contact us directly.",
    });
  }
};

// Newsletter subscription handler
const subscribeNewsletter = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, name } = req.body;

    // Here you would typically save to database
    // For now, just send welcome email
    const transporter = await createTransporter();

    const welcomeContent = `
      <h2>Welcome to Rynott Newsletter!</h2>
      <p>Dear ${name || "Valued Customer"},</p>
      <p>Thank you for subscribing to our newsletter! You'll be the first to know about:</p>
      <ul>
        <li>New product launches</li>
        <li>Exclusive deals and promotions</li>
        <li>Shopping tips and guides</li>
        <li>Special member-only offers</li>
      </ul>
      
      <p>Stay tuned for exciting updates!</p>
      
      <p>Best regards,<br>The Rynott Team</p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@rynott.com",
      to: email,
      subject: "Welcome to Rynott Newsletter!",
      html: welcomeContent,
    };

    const info = await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: "Successfully subscribed to newsletter!",
      data: { email, name },
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all contact submissions (Admin only)
const getContactSubmissions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const submissions = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments(query);

    res.status(200).json({
      success: true,
      data: submissions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact submissions",
    });
  }
};

// Get single contact submission (Admin only)
const getContactSubmission = async (req, res) => {
  try {
    const submission = await Contact.findById(req.params.id).populate(
      "reply.sentBy",
      "firstName lastName email"
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      });
    }

    // Mark as read
    if (submission.status === "new") {
      submission.status = "read";
      await submission.save();
    }

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error("Error fetching contact submission:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact submission",
    });
  }
};

// Update contact submission status (Admin only)
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["new", "read", "replied", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const submission = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact status updated",
      data: submission,
    });
  } catch (error) {
    console.error("Error updating contact submission:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update contact submission",
    });
  }
};

// Reply to contact submission (Admin only)
const replyToContact = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required",
      });
    }

    const submission = await Contact.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      });
    }

    // Send reply email
    const transporter = await createTransporter();

    const replyContent = `
      <h2>Response to Your Contact Form Submission</h2>
      <p>Dear ${submission.name},</p>
      <p>Thank you for reaching out. Here is our response to your inquiry:</p>
      
      <h3>Your original message (${submission.subject}):</h3>
      <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0;">
        ${submission.message.replace(/\n/g, "<br>")}
      </div>
      
      <h3>Our response:</h3>
      <div style="background: #fff8f0; padding: 15px; border-left: 4px solid #ff6b35; margin: 15px 0;">
        ${message.replace(/\n/g, "<br>")}
      </div>
      
      <p>If you have any further questions, feel free to contact us again.</p>
      
      <p>Best regards,<br>The Rynott Team</p>
      
      <hr>
      <p><small>This is an automated message. Please do not reply to this email.</small></p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@rynott.com",
      to: submission.email,
      subject: `Re: ${submission.subject}`,
      html: replyContent,
    };

    await transporter.sendMail(mailOptions);

    // Update submission with reply info
    submission.reply = {
      message,
      sentAt: new Date(),
      sentBy: req.user.id,
    };
    submission.status = "replied";

    await submission.save();
    await submission.populate("reply.sentBy", "firstName lastName email");

    res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      data: submission,
    });
  } catch (error) {
    console.error("Error replying to contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send reply",
    });
  }
};

// Delete contact submission (Admin only)
const deleteContactSubmission = async (req, res) => {
  try {
    const submission = await Contact.findByIdAndDelete(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact submission deleted",
    });
  } catch (error) {
    console.error("Error deleting contact submission:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact submission",
    });
  }
};

module.exports = {
  submitContactForm,
  subscribeNewsletter,
  getContactSubmissions,
  getContactSubmission,
  updateContactStatus,
  replyToContact,
  deleteContactSubmission,
};
