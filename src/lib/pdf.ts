import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { InterviewRecord } from '@/types/firestore';
import { toast } from 'sonner';
import { sections } from '@/data/scorecard';

export async function generatePDF(record: InterviewRecord): Promise<void> {
  console.log('generatePDF called');
  if (!record?.candidateName?.trim() || !record?.role?.trim() || !record?.companyName?.trim()) {
    toast("Please fill in all required fields before generating PDF");
    return;
  }

  if (!record.ratings || Object.keys(record.ratings).length === 0) {
    toast("Please provide at least one rating before generating PDF");
    return;
  }

  const toastId = toast("Generating PDF, please wait...");

  const element = document.createElement('div');
  element.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 816px;
    background: white;
    padding: 40px;
    font-family: Arial, sans-serif;
  `;

  document.body.appendChild(element);
  
  try {
    element.innerHTML = `
    <div style="color: black; background: white;">
      <h1 style="color: #333; margin-bottom: 20px;">Interview Scorecard</h1>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #666;">Candidate Information</h2>
        <p><strong>Name:</strong> ${record.candidateName}</p>
        <p><strong>Role:</strong> ${record.role}</p>
        <p><strong>Company:</strong> ${record.companyName}</p>
        <p><strong>Interviewer:</strong> ${record.interviewerName}</p>
        <p><strong>Date:</strong> ${new Date(record.interviewDate).toLocaleDateString()}</p>
        <p><strong>Decision:</strong> ${record.decision}</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #666;">Scores</h2>
        <p><strong>Skill Score:</strong> ${record.scores.skill.score}/${record.scores.skill.total} (${record.scores.skill.percentage}%)</p>
        <p><strong>Will Score:</strong> ${record.scores.will.score}/${record.scores.will.total} (${record.scores.will.percentage}%)</p>
        <p><strong>Total Score:</strong> ${record.scores.total.score}/${record.scores.total.total} (${record.scores.total.percentage}%)</p>
      </div>
      
      <div>
        <h2 style="color: #666;">Detailed Ratings & Notes</h2>
        ${Object.entries(sections).map(([section, items]) => `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #444; margin-bottom: 15px;">${section}</h3>
            ${items.map(item => {
              const key = `${section}-${item}`;
              const rating = record.ratings[key];
              if (rating) {
                return `
                  <div style="margin-bottom: 15px; padding-left: 15px;">
                    <p><strong>${item}:</strong> ${rating}/5</p>
                    <p><em>Notes:</em> ${record.notes[key] || 'No notes provided'}</p>
                  </div>
                `;
              }
              return '';
            }).join('')}
            </div>
        `).join('')}
      </div>
    </div>
  `;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 1,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      pdf.save(`${record.candidateName}_interview_scorecard.pdf`);
      toast.dismiss(toastId);
      toast("PDF exported successfully");
    } catch (error) {
      toast("Failed to generate PDF");
      throw error;
    }
  } catch (error) {
    toast("Failed to generate PDF. Please try again.");
    throw error;
  } finally {
    toast.dismiss(toastId);
    element.remove();
  }
}