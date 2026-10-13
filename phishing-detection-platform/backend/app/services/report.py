"""Report exports generated from saved scan records."""
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from app.models.scan import Scan


def scan_summary_text(scan: Scan) -> str:
    return (f"Scan {scan.id} ({scan.scan_type}) of '{scan.input_label}': risk score "
            f"{scan.risk_score}/100, {scan.classification}. "
            f"{len(scan.findings)} indicator(s) recorded. Estimates only; not a guarantee of safety.")


def scan_to_pdf(scan: Scan) -> bytes:
    buf = BytesIO()
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(buf, pagesize=A4, title=f"Scan report {scan.id}")
    from xml.sax.saxutils import escape as e
    story = [
        Paragraph("Phishing Detection Report", styles["Title"]),
        Paragraph(f"<b>Scan ID:</b> {e(scan.id)}", styles["Normal"]),
        Paragraph(f"<b>Type:</b> {e(scan.scan_type)} &nbsp; <b>Input:</b> {e(scan.input_label)}", styles["Normal"]),
        Paragraph(f"<b>Risk score:</b> {scan.risk_score}/100 &nbsp; <b>Classification:</b> {e(scan.classification)}", styles["Normal"]),
        Paragraph(f"<b>Created:</b> {scan.created_at.isoformat()}", styles["Normal"]),
        Spacer(1, 12),
        Paragraph("<b>Findings</b>", styles["Heading2"]),
    ]
    if not scan.findings:
        story.append(Paragraph("No risk indicators were recorded.", styles["Normal"]))
    for f in scan.findings:
        story.append(Paragraph(
            f"<b>{e(f['name'])}</b> ({e(f['severity'])}, contribution {f['contribution']})<br/>"
            f"Evidence: {e(f['evidence'])}<br/>Explanation: {e(f['explanation'])}<br/>"
            f"Recommendation: {e(f['recommendation'])}", styles["Normal"]))
        story.append(Spacer(1, 6))
    story.append(Paragraph("<b>Limitations</b>", styles["Heading2"]))
    for lim in scan.limitations:
        story.append(Paragraph("&bull; " + e(lim), styles["Normal"]))
    doc.build(story)
    return buf.getvalue()
