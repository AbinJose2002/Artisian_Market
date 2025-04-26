from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO
from datetime import datetime
import traceback

def generate_bid_invoice_pdf(bid_data):
    """Generate a PDF invoice for a bid auction"""
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
        
        # Document title
        title = Paragraph("Auction Invoice", styles['Center'])
        
        # Invoice details
        date_style = styles["Normal"]
        date_style.alignment = 2  # Right align
        date_text = f"Invoice Date: {datetime.now().strftime('%B %d, %Y')}"
        date = Paragraph(date_text, date_style)
        
        # Header with auction details
        header_style = styles["Heading2"]
        header = Paragraph(f"Auction Item: {bid_data.get('title', 'Auction Item')}", header_style)
        
        # Description
        description_style = styles["BodyText"]
        description = Paragraph(f"Description: {bid_data.get('description', 'No description available')}", description_style)
        
        # Format dates
        auction_date = "N/A"
        if bid_data.get("auction_date"):
            if isinstance(bid_data["auction_date"], str):
                auction_date = bid_data["auction_date"]
            else:
                auction_date = bid_data["auction_date"].strftime("%B %d, %Y")
                
        end_date = "N/A"
        if bid_data.get("end_date"):
            if isinstance(bid_data["end_date"], str):
                end_date = bid_data["end_date"]
            else:
                end_date = bid_data["end_date"].strftime("%B %d, %Y")
        
        # Create data table with winner's name instead of email
        data = [
            ["Invoice Number:", f"AUC-{str(bid_data.get('_id', ''))[:8]}"],
            ["Winner Name:", bid_data.get("winner_name", "Unknown")],  # Use name instead of email
            ["Winner Email:", bid_data.get("winner_email", "Unknown")],  # Include email for reference
            ["Seller:", bid_data.get("seller_name", "Unknown Seller")],
            ["Category:", bid_data.get("category", "Art")],
            ["Condition:", bid_data.get("condition", "New")],
            ["Auction Date:", auction_date],
            ["End Date:", end_date],
            ["Final Bid Amount:", f"₹{bid_data.get('final_amount', 0)}"],
        ]
        
        # Create the table
        table = Table(data, colWidths=[2*inch, 3.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        # Build the document with all elements
        elements = [
            title,
            Spacer(1, 0.5*inch),
            date,
            Spacer(1, 0.5*inch),
            header,
            Spacer(1, 0.25*inch),
            description,
            Spacer(1, 0.5*inch),
            table,
            Spacer(1, 0.5*inch),
            Paragraph("Thank you for participating in our auction!", styles["BodyText"]),
            Spacer(1, 0.25*inch),
            Paragraph("This is an automatically generated invoice for your successful bid.", styles["BodyText"])
        ]
        
        # Write the document to the buffer
        doc.build(elements)
        
        # Reset buffer position to the beginning
        buffer.seek(0)
        
        return buffer
    except Exception as e:
        print(f"Error generating bid invoice PDF: {str(e)}")
        traceback.print_exc()
        raise
