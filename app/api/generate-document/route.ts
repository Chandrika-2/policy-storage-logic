import { NextRequest, NextResponse } from "next/server"
import PizZip from "pizzip"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fileContent, // base64 encoded docx
      fileName,
      companyName,
      logo, // base64 encoded logo
      headerText,
      footerCenterText,
      footerRightText,
      originalCompanyName = "Aistra",
    } = body

    // Validate required fields
    if (!fileContent) {
      return NextResponse.json(
        { error: "No file content provided. Please re-upload the policy document." },
        { status: 400 }
      )
    }

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required." },
        { status: 400 }
      )
    }

    // Decode the base64 file content
    let base64Data = fileContent
    if (fileContent.includes(",")) {
      base64Data = fileContent.split(",")[1]
    }
    
    const fileBuffer = Buffer.from(base64Data, "base64")

    // DOCX files start with PK (50 4B in hex) since they're ZIP files
    if (fileBuffer[0] !== 0x50 || fileBuffer[1] !== 0x4B) {
      return NextResponse.json(
        { error: "Invalid file format. The file does not appear to be a valid DOCX document. Please re-upload." },
        { status: 400 }
      )
    }

    // Load the docx file
    const zip = new PizZip(fileBuffer)

    // Replace company name in all XML content files
    const xmlFiles = [
      "word/document.xml",
      "word/header1.xml",
      "word/header2.xml", 
      "word/header3.xml",
      "word/footer1.xml",
      "word/footer2.xml",
      "word/footer3.xml",
      "word/styles.xml",
      "word/settings.xml",
    ]

    for (const xmlFile of xmlFiles) {
      try {
        if (zip.files[xmlFile]) {
          let content = zip.files[xmlFile].asText()
          // Replace all variations of the original company name (case insensitive)
          const regex = new RegExp(originalCompanyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gi")
          content = content.replace(regex, companyName)
          zip.file(xmlFile, content)
        }
      } catch (e) {
        // File doesn't exist or can't be read, skip
      }
    }

    // Create or update header with logo and company name
    const headerXml = createHeaderXml(logo, headerText || companyName, zip)
    
    // Create or update footer with page number, center text, and right text
    const footerXml = createFooterXml(
      footerCenterText || "Company Internal",
      footerRightText || "Created by SecComply"
    )

    // Add header and footer to the document
    zip.file("word/header1.xml", headerXml)
    zip.file("word/footer1.xml", footerXml)

    // Update document relationships to include header and footer
    updateRelationships(zip, logo)

    // Update document.xml to reference header and footer
    updateDocumentReferences(zip)

    // If logo is provided, replace ALL existing images in the document with the new logo
    if (logo) {
      try {
        let logoBase64 = logo
        if (logo.includes(",")) {
          logoBase64 = logo.split(",")[1]
        }
        const logoBuffer = Buffer.from(logoBase64, "base64")
        
        // Find all existing images in the media folder and replace them with the new logo
        const mediaFiles = Object.keys(zip.files).filter(
          (name) => name.startsWith("word/media/") && 
          (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".gif"))
        )
        
        // Replace each existing image with the new logo
        for (const mediaFile of mediaFiles) {
          zip.file(mediaFile, logoBuffer, { binary: true })
        }
        
        // Also add as image1.png for the header
        zip.file("word/media/image1.png", logoBuffer, { binary: true })
      } catch (e) {
        console.error("Error adding logo:", e)
      }
    }

    // Update content types to include image if logo provided
    if (logo) {
      updateContentTypes(zip)
    }

    // Generate the modified docx
    const modifiedDocx = zip.generate({
      type: "nodebuffer",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
    })

    const outputFileName = `${companyName.replace(/[^a-zA-Z0-9\s]/g, "_")}_${fileName || "document.docx"}`

    return new NextResponse(modifiedDocx, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${outputFileName}"`,
      },
    })
  } catch (error) {
    console.error("Error generating document:", error)
    return NextResponse.json(
      { error: "Failed to generate document", details: String(error) },
      { status: 500 }
    )
  }
}

function createHeaderXml(logo: string | null, headerText: string, zip: PizZip): string {
  const logoRef = logo ? `
    <w:r>
      <w:drawing>
        <wp:inline distT="0" distB="0" distL="0" distR="0">
          <wp:extent cx="914400" cy="457200"/>
          <wp:docPr id="1" name="Logo"/>
          <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:nvPicPr>
                  <pic:cNvPr id="1" name="Logo"/>
                  <pic:cNvPicPr/>
                </pic:nvPicPr>
                <pic:blipFill>
                  <a:blip r:embed="rId1"/>
                  <a:stretch>
                    <a:fillRect/>
                  </a:stretch>
                </pic:blipFill>
                <pic:spPr>
                  <a:xfrm>
                    <a:off x="0" y="0"/>
                    <a:ext cx="914400" cy="457200"/>
                  </a:xfrm>
                  <a:prstGeom prst="rect">
                    <a:avLst/>
                  </a:prstGeom>
                </pic:spPr>
              </pic:pic>
            </a:graphicData>
          </a:graphic>
        </wp:inline>
      </w:drawing>
    </w:r>` : ''

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Header"/>
      <w:tabs>
        <w:tab w:val="right" w:pos="9360"/>
      </w:tabs>
    </w:pPr>
    ${logoRef}
    <w:r>
      <w:tab/>
    </w:r>
    <w:r>
      <w:rPr>
        <w:b/>
        <w:sz w:val="24"/>
      </w:rPr>
      <w:t>${escapeXml(headerText)}</w:t>
    </w:r>
  </w:p>
</w:hdr>`
}

function createFooterXml(centerText: string, rightText: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Footer"/>
      <w:tabs>
        <w:tab w:val="center" w:pos="4680"/>
        <w:tab w:val="right" w:pos="9360"/>
      </w:tabs>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:sz w:val="18"/>
      </w:rPr>
      <w:t>Page </w:t>
    </w:r>
    <w:r>
      <w:fldChar w:fldCharType="begin"/>
    </w:r>
    <w:r>
      <w:instrText>PAGE</w:instrText>
    </w:r>
    <w:r>
      <w:fldChar w:fldCharType="end"/>
    </w:r>
    <w:r>
      <w:tab/>
    </w:r>
    <w:r>
      <w:rPr>
        <w:sz w:val="18"/>
      </w:rPr>
      <w:t>${escapeXml(centerText)}</w:t>
    </w:r>
    <w:r>
      <w:tab/>
    </w:r>
    <w:r>
      <w:rPr>
        <w:sz w:val="18"/>
      </w:rPr>
      <w:t>${escapeXml(rightText)}</w:t>
    </w:r>
  </w:p>
</w:ftr>`
}

function updateRelationships(zip: PizZip, logo: string | null): void {
  // Update header relationships
  let headerRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
  
  if (logo) {
    headerRels += `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>`
  }
  headerRels += `</Relationships>`
  
  zip.file("word/_rels/header1.xml.rels", headerRels)

  // Update main document relationships
  let docRels = ""
  try {
    if (zip.files["word/_rels/document.xml.rels"]) {
      docRels = zip.files["word/_rels/document.xml.rels"].asText()
    }
  } catch (e) {
    docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`
  }

  // Add header and footer relationships if they don't exist
  if (!docRels.includes('relationships/header"') && !docRels.includes("header1.xml")) {
    const headerRel = `<Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>`
    docRels = docRels.replace("</Relationships>", headerRel + "</Relationships>")
  }

  if (!docRels.includes('relationships/footer"') && !docRels.includes("footer1.xml")) {
    const footerRel = `<Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>`
    docRels = docRels.replace("</Relationships>", footerRel + "</Relationships>")
  }

  zip.file("word/_rels/document.xml.rels", docRels)
}

function updateDocumentReferences(zip: PizZip): void {
  try {
    if (!zip.files["word/document.xml"]) return

    let docXml = zip.files["word/document.xml"].asText()
    
    // Check if sectPr exists
    if (docXml.includes("<w:sectPr")) {
      // Add header and footer references to sectPr if they don't exist
      if (!docXml.includes("w:headerReference") && !docXml.includes("headerReference")) {
        docXml = docXml.replace(
          /<w:sectPr([^>]*)>/g,
          '<w:sectPr$1><w:headerReference w:type="default" r:id="rIdHeader1"/><w:footerReference w:type="default" r:id="rIdFooter1"/>'
        )
      }
    } else {
      // Add sectPr with header and footer at the end of body
      docXml = docXml.replace(
        "</w:body>",
        `<w:sectPr>
          <w:headerReference w:type="default" r:id="rIdHeader1"/>
          <w:footerReference w:type="default" r:id="rIdFooter1"/>
          <w:pgSz w:w="12240" w:h="15840"/>
          <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720"/>
        </w:sectPr>
        </w:body>`
      )
    }

    zip.file("word/document.xml", docXml)
  } catch (e) {
    console.error("Error updating document references:", e)
  }
}

function updateContentTypes(zip: PizZip): void {
  try {
    if (!zip.files["[Content_Types].xml"]) return

    let contentTypes = zip.files["[Content_Types].xml"].asText()

    // Add PNG content type if not exists
    if (!contentTypes.includes('Extension="png"')) {
      contentTypes = contentTypes.replace(
        "</Types>",
        '<Default Extension="png" ContentType="image/png"/></Types>'
      )
    }

    // Add header content type if not exists
    if (!contentTypes.includes("/header1.xml")) {
      contentTypes = contentTypes.replace(
        "</Types>",
        '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/></Types>'
      )
    }

    // Add footer content type if not exists
    if (!contentTypes.includes("/footer1.xml")) {
      contentTypes = contentTypes.replace(
        "</Types>",
        '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>'
      )
    }

    zip.file("[Content_Types].xml", contentTypes)
  } catch (e) {
    console.error("Error updating content types:", e)
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
