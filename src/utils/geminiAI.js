// ============================================
// RESUME PARSING
// ============================================

const extractTextFromPDF = async (file) => {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    fullText += pageText + " ";
  }

  return fullText.trim();
};

const extractTextFromWord = async (file) => {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const parseResume = async (file) => {
  try {
    let extractedText = "";

    if (file.type === "application/pdf") {
      extractedText = await extractTextFromPDF(file);
    } else if (file.type.includes("word")) {
      extractedText = await extractTextFromWord(file);
    } else {
      extractedText = await file.text();
    }

    return {
      rawText: extractedText,
      uploadDate: new Date().toISOString(),
      fileName: file.name,
    };
  } catch (error) {
    console.error("Resume parsing failed:", error);
    return {
      rawText: "",
      uploadDate: new Date().toISOString(),
      fileName: file.name,
    };
  }
};

// ============================================
// AI ANALYSIS WITH GEMINI
// ============================================

export const analyzeJobAlignment = async (application, resumeData) => {
  if (!resumeData || !application.jobDescription) {
    return null;
  }

  console.log(`Analyzing: ${application.role} at ${application.company}`);

  try {
const prompt = `You are an expert career advisor and ATS (Applicant Tracking System) analyst. Analyze how well this resume matches the job posting.

RESUME:
${resumeData.rawText.substring(0, 3000)}

JOB POSTING:
Role: ${application.role}
Company: ${application.company}
Location: ${application.location}
Description: ${application.jobDescription}

Analyze the match based on:
1. Skills alignment (technical and soft skills)
2. Experience level and relevance
3. Education and certifications
4. Keywords from job description present in resume
5. Overall fit for the role

Provide a matchScore (0-100):
- 80-100: Excellent match, strong candidate
- 60-79: Good match, qualified candidate
- 40-59: Moderate match, some gaps
- 0-39: Poor match, significant gaps

Provide priority (High/Medium/Low):
- High: Strong match, apply immediately
- Medium: Good match, worth applying
- Low: Weak match, consider improving resume first

Return ONLY valid JSON (no markdown, no code blocks):
{
  "matchScore": <number 0-100>,
  "priority": "<High|Medium|Low>",
  "analysis": "<2-3 sentence summary of match quality and key strengths>",
  "recommendations": ["<specific action 1>", "<specific action 2>", "<specific action 3>"]
}`;
    const response = await fetch("http://localhost:3001/api/gemini-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Gemini API error:", data.error);
      throw new Error(data.error.message || "API error");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("No text in Gemini response");
      throw new Error("No text in response");
    }

    console.log("Raw Gemini response:", text.substring(0, 200) + "...");

    // Remove markdown code blocks if present
    const cleanText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);

      console.log("Analysis complete:", {
        matchScore: result.matchScore,
        priority: result.priority,
      });

      return {
        matchScore: result.matchScore,
        priority: result.priority,
        aiAnalysis: result.analysis,
        recommendations: result.recommendations,
      };
    }

    console.error("Could not extract JSON from response");
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("AI analysis failed:", error);
    return {
      matchScore: null,
      priority: "",
      analysis: "",
      recommendations: [""],
    };
  }
};
