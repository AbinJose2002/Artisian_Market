from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO
from datetime import datetime

def create_bid_invoice(bid_data):
    """Create a simple PDF invoice for a bid auction"""
    try:
        # Create a file-like buffer to receive PDF data
        buffer = BytesIO()
        
        # Set up the document with letter size paper
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Styles
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name='Center',
            parent=styles['Heading1'],
            alignment=1,  # 0=left, 1=center, 2=right
        ))
        
        # Document elements
        elements = []
        
        # Add title
        title = Paragraph("Auction Invoice", styles['Center'])
        elements.append(title)
        elements.append(Spacer(1, 0.5*inch))
        
        # Add date
        date_style = styles["Normal"]
        date_style.alignment = 2  # Right align
        date_text = f"Invoice Date: {datetime.now().strftime('%B %d, %Y')}"
        date = Paragraph(date_text, date_style)
        elements.append(date)
        elements.append(Spacer(1, 0.5*inch))
        
        # Add auction title
        header_style = styles["Heading2"]
        header = Paragraph(f"Auction Item: {bid_data.get('title', 'Auction Item')}", header_style)
        elements.append(header)
        elements.append(Spacer(1, 0.25*inch))
        
        # Add description if available
        if bid_data.get('description'):
            description_style = styles["BodyText"]
            description = Paragraph(f"Description: {bid_data.get('description')}", description_style)
            elements.append(description)
            elements.append(Spacer(1, 0.25*inch))
        
        # Create basic bid details table
        data = [
            ["Invoice Number:", f"AUC-{str(bid_data.get('_id', ''))[:8]}"],
            ["Winner:", bid_data.get("winner", "Unknown")],
            ["Final Bid Amount:", f"₹{bid_data.get('final_amount', 0)}"],
            ["Auction Date:", str(bid_data.get('auction_date', 'N/A'))],
            ["End Date:", str(bid_data.get('end_date', 'N/A'))],
        ]
        
        table = Table(data, colWidths=[2*inch, 3.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.5*inch))
        
        # Add footer text
        elements.append(Paragraph("Thank you for participating in our auction!", styles["BodyText"]))
        
        # Build PDF
        doc.build(elements)
        
        # Reset buffer position to the beginning
        buffer.seek(0)
        
        return buffer
    except Exception as e:
        print(f"Error creating bid invoice PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
