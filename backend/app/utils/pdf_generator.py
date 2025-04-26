from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import io
import os
import traceback

def generate_invoice_pdf(order_data):
    """Generate a PDF invoice for an order"""
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
        title = Paragraph("Order Invoice", styles['Center'])
        
        # Invoice details
        date_style = styles["Normal"]
        date_style.alignment = 2  # Right align
        date_text = f"Invoice Date: {datetime.now().strftime('%B %d, %Y')}"
        date = Paragraph(date_text, date_style)
        
        # Create data table
        data = [
            ["Invoice Number:", f"INV-{str(order_data.get('_id', ''))[:8]}"],
            ["Order Date:", str(order_data.get('created_at', 'N/A'))],
            ["Payment ID:", order_data.get('payment_id', 'N/A')],
            ["Total Amount:", f"₹{order_data.get('total_amount', 0)}"],
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
        
        # Items table headers
        items_data = [["Item", "Price"]]
        
        # Add items to the table
        for item in order_data.get('items', []):
            items_data.append([item.get('name', 'Unknown Item'), f"₹{item.get('price', 0)}"])
        
        # Create the items table
        items_table = Table(items_data, colWidths=[4*inch, 1.5*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        # Build the document with all elements
        elements = [
            title,
            Spacer(1, 0.5*inch),
            date,
            Spacer(1, 0.5*inch),
            table,
            Spacer(1, 0.5*inch),
            Paragraph("Items Purchased:", styles["Heading3"]),
            Spacer(1, 0.25*inch),
            items_table,
            Spacer(1, 0.5*inch),
            Paragraph("Thank you for your purchase!", styles["BodyText"]),
        ]
        
        # Write the document to the buffer
        doc.build(elements)
        
        # Reset buffer position to the beginning
        buffer.seek(0)
        
        return buffer
    except Exception as e:
        print(f"Error generating invoice PDF: {str(e)}")
        traceback.print_exc()
        raise

def generate_receipt_pdf(order_data):
    # Simplified version for receipts
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    elements = []
    elements.append(Paragraph("Artisian Market - Receipt", styles["Title"]))
    elements.append(Spacer(1, 20))
    
    elements.append(Paragraph(f"Order ID: {order_data.get('_id', 'N/A')[:8]}", styles["Normal"]))
    elements.append(Paragraph(f"Date: {datetime.now().strftime('%B %d, %Y')}", styles["Normal"]))
    elements.append(Spacer(1, 10))
    
    items_data = [["Item", "Price"]]
    for item in order_data.get('items', []):
        items_data.append([item.get('name', 'N/A'), f"₹{item.get('price', '0.00')}"])
    
    total = sum([float(item.get('price', 0)) for item in order_data.get('items', [])])
    items_data.append(["Total", f"₹{total}"])
    
    table = Table(items_data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_auction_invoice_pdf(auction_data):
    """
    Generate a PDF invoice for a won auction bid
    
    Args:
        auction_data: Dictionary containing auction/bid details
    
    Returns:
        BytesIO object containing the PDF
    """
    from io import BytesIO
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from datetime import datetime
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Create custom styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=1,
        spaceAfter=20
    )
    
    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=10
    )
    
    normal_style = styles["Normal"]
    
    # Start building the document
    elements = []
    
    # Title
    elements.append(Paragraph("Art Auction Invoice", title_style))
    elements.append(Spacer(1, 20))
    
    # Invoice info
    invoice_data = [
        ["Invoice Date:", datetime.now().strftime("%Y-%m-%d")],
        ["Auction ID:", auction_data.get("auction_id", "N/A")],
        ["End Date:", auction_data.get("last_date", "N/A")]
    ]
    
    invoice_table = Table(invoice_data, colWidths=[100, 300])
    invoice_table.setStyle(TableStyle([
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    
    elements.append(invoice_table)
    elements.append(Spacer(1, 20))
    
    # Item details
    elements.append(Paragraph("Auction Details", heading_style))
    elements.append(Spacer(1, 10))
    
    item_data = [
        ["Item", "Description", "Winning Bid"],
    ]
    
    item_data.append([
        auction_data.get("title", "N/A"),
        auction_data.get("description", "N/A"),
        f"₹{auction_data.get('current_amount', 0)}"
    ])
    
    item_table = Table(item_data, colWidths=[100, 300, 100])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
    ]))
    
    elements.append(item_table)
    elements.append(Spacer(1, 20))
    
    # Bidder details
    elements.append(Paragraph("Bidder Information", heading_style))
    elements.append(Spacer(1, 10))
    
    bidder_data = [
        ["Bidder Email:", auction_data.get("highest_bidder", "N/A")],
        ["Bidder Role:", auction_data.get("bidder_role", "Buyer")],
    ]
    
    bidder_table = Table(bidder_data, colWidths=[100, 300])
    bidder_table.setStyle(TableStyle([
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    
    elements.append(bidder_table)
    elements.append(Spacer(1, 20))
    
    # Total
    elements.append(Paragraph("Payment Summary", heading_style))
    elements.append(Spacer(1, 10))
    
    payment_data = [
        ["Winning Bid Amount:", f"₹{auction_data.get('current_amount', 0)}"],
        ["Platform Fee (5%):", f"₹{float(auction_data.get('current_amount', 0)) * 0.05:.2f}"],
        ["Total Amount Due:", f"₹{float(auction_data.get('current_amount', 0)) * 1.05:.2f}"]
    ]
    
    payment_table = Table(payment_data, colWidths=[150, 150])
    payment_table.setStyle(TableStyle([
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (0, 2), (1, 2), 'Helvetica-Bold'),
        ('LINEABOVE', (0, 2), (1, 2), 1, colors.black),
    ]))
    
    elements.append(payment_table)
    elements.append(Spacer(1, 40))
    
    # Terms and conditions
    terms_text = """
    Terms and Conditions:
    1. This is an official receipt for your auction purchase.
    2. The artwork will be shipped within 5 business days.
    3. For any inquiries, please contact support@artisianmarket.com.
    4. All sales are final. No returns or exchanges are allowed.
    """
    elements.append(Paragraph(terms_text, normal_style))
    
    # Build the PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

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
        
        # Create data table
        data = [
            ["Invoice Number:", f"AUC-{str(bid_data.get('_id', ''))[:8]}"],
            ["Winner:", bid_data.get("winner", "Unknown")],
            ["Seller Name:", bid_data.get("seller_name", "Unknown Seller")],
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
