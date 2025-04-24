from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import io
import os

def generate_invoice_pdf(order_data):
    # Create an in-memory PDF file
    buffer = io.BytesIO()
    
    # Set up the PDF document
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        name='Title',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=1,  # 0=left, 1=center, 2=right
        spaceAfter=20
    )
    
    header_style = ParagraphStyle(
        name='Header',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=10
    )
    
    normal_style = styles["Normal"]
    
    # Create content elements
    elements = []
    
    # Add company logo if available
    logo_path = os.path.join(os.getcwd(), "static", "logo.png")
    if os.path.exists(logo_path):
        img = Image(logo_path, width=1.5*inch, height=0.5*inch)
        elements.append(img)
        elements.append(Spacer(1, 10))
    
    # Title
    elements.append(Paragraph("Artisian Market - Invoice", title_style))
    elements.append(Spacer(1, 10))
    
    # Invoice details
    elements.append(Paragraph(f"<b>Invoice #:</b> {order_data.get('_id', 'N/A')[:8]}", normal_style))
    elements.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}", normal_style))
    elements.append(Paragraph(f"<b>Payment ID:</b> {order_data.get('payment_id', 'N/A')}", normal_style))
    elements.append(Spacer(1, 20))
    
    # Items table
    elements.append(Paragraph("Purchased Items", header_style))
    
    # Table header
    table_data = [["Item Name", "Category", "Type", "Price"]]
    
    # Table rows
    for item in order_data.get('items', []):
        item_type = "Art Product" if item.get('itemType') == 'product' else "Craft Material"
        table_data.append([
            item.get('name', 'N/A'),
            item.get('category', 'N/A'),
            item_type,
            f"₹{item.get('price', '0.00')}"
        ])
    
    # Add total row
    total_amount = order_data.get('total_amount', sum([float(item.get('price', 0)) for item in order_data.get('items', [])]))
    table_data.append(["", "", "<b>Total</b>", f"<b>₹{total_amount}</b>"])
    
    # Create and style the table
    table = Table(table_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch, 1*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (3, 1), (3, -1), 'RIGHT'),  # Price column right-aligned
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),  # Bold for total row
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
        ('GRID', (0, 0), (-1, -2), 0.5, colors.grey),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 20))
    
    # Terms and conditions
    elements.append(Paragraph("Terms and Conditions", header_style))
    terms = [
        "All sales are final. No returns or exchanges unless items are damaged upon receipt.",
        "Delivery is subject to availability and processing time.",
        "For any queries, please contact support@artisianmarket.com"
    ]
    for term in terms:
        elements.append(Paragraph(f"• {term}", normal_style))
    
    # Build the PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

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
