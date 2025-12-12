import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import saveAs from "file-saver";
import { Question } from "../types";

export const exportToWord = async (questions: Question[], filename: string = "Exam_Questions.docx") => {
  const docChildren: any[] = [
    new Paragraph({
      text: "璇宝的考试题库 - 生成试卷",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
        text: "说明：请为每道题选择最佳答案。多选题请选择所有正确选项。",
        spacing: { after: 400 },
    }),
  ];

  questions.forEach((q, index) => {
    // Question Text
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. [${q.type === 'multiple' ? '多选' : '单选'}] ${q.text}`,
            bold: true,
            size: 24,
          }),
        ],
        spacing: { before: 400, after: 200 },
      })
    );

    // Options
    q.options.forEach((opt, optIndex) => {
      const label = String.fromCharCode(65 + optIndex); // A, B, C, D
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `   ${label}. ${opt}`,
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    });
  });

  // Answer Key Section (New Page)
  docChildren.push(
    new Paragraph({
      text: "答案与解析",
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  questions.forEach((q, index) => {
    // Convert array of indices to string like "A, C"
    const correctLabel = q.correctAnswerIndices
        .map(i => String.fromCharCode(65 + i))
        .join(", ");
        
    docChildren.push(
        new Paragraph({
            children: [
                new TextRun({ text: `${index + 1}: ${correctLabel}`, bold: true }),
            ],
            spacing: { before: 200 },
        }),
        new Paragraph({
            children: [
                 new TextRun({ text: `解析: ${q.explanation}`, italics: true })
            ],
             spacing: { after: 200 },
        })
    )
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};