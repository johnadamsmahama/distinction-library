export const metadata = {
  title: 'DISTINCTION LIBRARY — Free Academic Resources for UPSA Students',
  description: 'A free digital repository of past exam papers, AI study tools, and career resources — built by a student, for students.',
  openGraph: {
    title: 'DISTINCTION LIBRARY',
    description: 'Free past papers, AI study tools, and career resources — built for UPSA students.',
  },
};

export default function SharePage() {
  return (
    <>
      <style>{`
        .share-body { margin:0; padding:0; background-color:#F7F8FC; font-family:'Helvetica Neue', Arial, sans-serif; }
        .share-body table { border-collapse:collapse; }
        .wrapper-table { width:100%; background-color:#F7F8FC; }
        .card { background:#ffffff; box-shadow:0 2px 12px rgba(6,15,30,0.08); }
        .header-cell { background-color:#0D2B5E; background-image:linear-gradient(135deg, #060F1E 0%, #0D2B5E 100%); padding:28px 32px; text-align:center; }
        .logo { font-family:Georgia,'Playfair Display',serif; color:#F7F8FC; font-size:22px; font-weight:bold; letter-spacing:0.5px; }
        .tagline { color:#C9A02C; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; margin-top:4px; }
        .body-content { padding:32px; color:#1a1a2e; font-size:15px; line-height:1.6; }
        .greeting { font-size:15px; margin-bottom:14px; }
        .intro-line { margin:0 0 18px 0; }
        .feature-card { background:#FAF8F2; border:1px solid #E6E1D3; margin:8px 0 20px 0; }
        .feature-card-inner { padding:26px 26px 16px 26px; }
        .feature-table td { vertical-align:top; padding:0; width:50%; }
        .feature-col { padding-left:0; padding-right:16px; }
        .feature-col.right { padding-right:0; padding-left:16px; }
        .feature-item { margin-bottom:12px; font-size:14px; line-height:1.45; }
        .feature-item b { color:#0D2B5E; display:block; }
        .feature-item span.detail { color:#555; font-size:12.5px; }
        .hook { font-family:Georgia,'Playfair Display',serif; font-style:italic; font-size:15px; color:#0D2B5E; border-left:3px solid #C9A02C; padding-left:14px; margin:22px 0; }
        .cta-wrap { text-align:center; margin:26px 0 8px 0; }
        .cta-btn { background-color:#0D2B5E; }
        .cta-btn a { color:#ffffff !important; text-decoration:none; font-weight:bold; font-size:14px; letter-spacing:0.3px; display:block; padding:14px 32px; }
        .url-line { text-align:center; font-size:13px; color:#888; margin-top:10px; }
        .signoff-line { margin-top:24px; }
        .signoff { font-weight:bold; color:#0D2B5E; }
        .share-footer { padding:20px 32px 28px 32px; text-align:center; font-size:11px; color:#999; border-top:1px solid #eee; }
        @media only screen and (max-width:600px) {
          .card-wrap { width:100% !important; }
          .body-content, .header-cell, .share-footer { padding-left:20px !important; padding-right:20px !important; }
        }
      `}</style>

      <div className="share-body" style={{ margin: 0, padding: 0, backgroundColor: '#F7F8FC' }}>
        <center className="wrapper-table">
          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ backgroundColor: '#F7F8FC' }}>
            <tbody>
              <tr>
                <td align="center" style={{ padding: '32px 16px' }}>
                  <table
                    role="presentation"
                    className="card-wrap card"
                    width={560}
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    align="center"
                    style={{ maxWidth: 560, width: '100%', backgroundColor: '#ffffff' }}
                  >
                    <tbody>
                      {/* Header */}
                      <tr>
                        <td className="header-cell" bgcolor="#0D2B5E" align="center" style={{ padding: '28px 32px', textAlign: 'center' }}>
                          <div className="logo">DISTINCTION LIBRARY</div>
                          <div className="tagline">Built for UPSA Students</div>
                        </td>
                      </tr>

                      {/* Body */}
                      <tr>
                        <td className="body-content" style={{ padding: 32, color: '#1a1a2e', fontSize: 15, lineHeight: 1.6 }}>
                          <div className="greeting">Hi Distinguished Scholar,</div>

                          <div className="intro-line">
                            Distinction Library is a free digital repository, stocked with academic resources and opportunities, built by a student for students.
                          </div>

                          <div className="intro-line" style={{ marginBottom: 10 }}>
                            <b>Get started for free and access:</b>
                          </div>

                          <table
                            role="presentation"
                            width="100%"
                            cellPadding={0}
                            cellSpacing={0}
                            border={0}
                            className="feature-card"
                            style={{ background: '#FAF8F2', border: '1px solid #E6E1D3', margin: '8px 0 20px 0' }}
                          >
                            <tbody>
                              <tr>
                                <td className="feature-card-inner" style={{ padding: '26px 26px 16px 26px' }}>
                                  <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} className="feature-table">
                                    <tbody>
                                      <tr>
                                        <td className="feature-col" width="50%" valign="top">
                                          <div className="feature-item" style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.45 }}>
                                            <div style={{ color: '#0D2B5E', fontWeight: 'bold' }}>Past Exam Papers</div>
                                            <div style={{ color: '#555', fontSize: 12.5 }}>Organized by course</div>
                                          </div>
                                          <div className="feature-item" style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.45 }}>
                                            <div style={{ color: '#0D2B5E', fontWeight: 'bold' }}>AI Tools</div>
                                            <div style={{ color: '#555', fontSize: 12.5 }}>Study Companion, Quiz Generator, Presentation Kit</div>
                                          </div>
                                          <div className="feature-item" style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.45 }}>
                                            <div style={{ color: '#0D2B5E', fontWeight: 'bold' }}>Jobs &amp; Opportunities</div>
                                            <div style={{ color: '#555', fontSize: 12.5 }}>Scholarships, Internships</div>
                                          </div>
                                          <div className="feature-item" style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.45 }}>
                                            <div style={{ color: '#0D2B5E', fontWeight: 'bold' }}>Peer Tutoring</div>
                                          </div>
                                        </td>
                                        <td className="feature-col right" width="50%" valign="top">
                                          <div className="feature-item" style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.45 }}>
                                            <div style={{ color: '#0D2B5E', fontWeight: 'bold' }}>Lecture Materials</div>
                                            <div style={{ color: '#555', fontSize: 12.5 }}>Slides and study notes</div>
                                          </div>
                                          <div className="feature-item" style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.45 }}>
                                            <div style={{ color: '#0D2B5E', fontWeight: 'bold' }}>Career Resources</div>
                                            <div style={{ color: '#555', fontSize: 12.5 }}>CV Builder, Cover Letter Generator</div>
                                          </div>
                                          <div className="feature-item" style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.45 }}>
                                            <div style={{ color: '#0D2B5E', fontWeight: 'bold' }}>Events &amp; Sessions</div>
                                            <div style={{ color: '#555', fontSize: 12.5 }}>Workshops, Career Fairs</div>
                                          </div>
                                          <div className="feature-item" style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.45 }}>
                                            <div style={{ color: '#0D2B5E', fontWeight: 'bold' }}>Private Study Vault</div>
                                          </div>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          <div className="hook">
                            Distinction is not accidental. It is built, but shouldn&apos;t require luck either.
                          </div>

                          <div className="cta-wrap">
                            <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center">
                              <tbody>
                                <tr>
                                  <td className="cta-btn" bgcolor="#0D2B5E" style={{ borderRadius: 0 }}>
                                    <a
                                      href="https://distinctionlibrary.com"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: '#ffffff',
                                        textDecoration: 'none',
                                        fontWeight: 'bold',
                                        fontSize: 14,
                                        letterSpacing: 0.3,
                                        display: 'block',
                                        padding: '14px 32px',
                                        fontFamily: "'Helvetica Neue', Arial, sans-serif",
                                      }}
                                    >
                                      Explore Distinction Library &rarr;
                                    </a>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div className="url-line">distinctionlibrary.com</div>

                          <div className="signoff-line">See you there,</div>
                          <div className="signoff">The Team, Distinction Library</div>
                        </td>
                      </tr>

                      {/* Footer */}
                      <tr>
                        <td className="share-footer">
                          Shared by a fellow student
                          <br />
                          <strong style={{ color: '#666' }}>The Team, Distinction Library</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </center>
      </div>
    </>
  );
}
