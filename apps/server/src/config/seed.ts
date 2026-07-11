import { prisma } from "./prisma";
import { Discipline, DrawingStatus, ConflictCategory, ConflictSeverity } from "@prisma/client";

export async function seedDatabase() {
  const drawingCount = await prisma.drawing.count();
  if (drawingCount > 0) {
    console.log("🌱 Database already has drawings, skipping seed.");
    return;
  }

  console.log("🌱 Database is empty. Seeding initial BuildOps demo data...");

  // Run in a single transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Create 500 Gaj Residence Drawing (A-101 Ground Floor Plan)
    const drawing1 = await tx.drawing.create({
      data: {
        hash: "seed_hash_500_gaj_a101",
        fileName: "A-101_Ground_Floor_Plan.pdf",
        fileUrl: "https://res.cloudinary.com/daofwiqhx/raw/upload/v123456/A-101_Ground_Floor_Plan.pdf",
        publicId: "drawings/A-101_Ground_Floor_Plan",
        discipline: Discipline.ARCHITECTURAL,
        status: DrawingStatus.PARSED,
        documentType: "Architectural Drawing",
        classificationConfidence: 0.98,
        projectName: "500 Gaj Residence",
        drawingNo: "A-101",
        revision: "Rev 0",
        parsedJson: {
          projectName: "500 Gaj Residence",
          drawingNumber: "A-101",
          discipline: "ARCHITECTURAL",
          spaces: [
            { name: "Kitchen", dimensions: "16 x 14" },
            { name: "Living Room", dimensions: "24 x 18" },
            { name: "Master Bedroom", dimensions: "18 x 16" },
            { name: "Bedroom 2", dimensions: "14 x 14" },
          ],
        },
      } as any,
    });

    // Create conflicts for drawing1
    const conflicts = [
      {
        drawingId: drawing1.id,
        category: ConflictCategory.GEOMETRY,
        severity: ConflictSeverity.HIGH,
        title: "Door intersects wall",
        description: "Architectural drawing shows Door D-04 swinging radius directly intersecting Wall W-12 structural boundary.",
        entityA: "Door D-04",
        entityB: "Wall W-12",
        recommendation: "Relocate door opening by minimum 300mm toward Axis C. Verify wall thickness at junction point. Coordinate with structural engineer before revision.",
      },
      {
        drawingId: drawing1.id,
        category: ConflictCategory.GEOMETRY,
        severity: ConflictSeverity.HIGH,
        title: "Window opening exceeds structural span",
        description: "Window W-02 opening width exceeds the permissible structural lintel span limit specified in structural drawings.",
        entityA: "Window W-02",
        entityB: "Lintel L-02",
        recommendation: "Reduce window width to 1200mm or increase lintel reinforcement schedule according to structural specifications.",
      },
      {
        drawingId: drawing1.id,
        category: ConflictCategory.SEMANTIC,
        severity: ConflictSeverity.HIGH,
        title: "Staircase width below code minimum",
        description: "Staircase S1 clear width measures 900mm, which is below the National Building Code (NBC 2016) code minimum of 1000mm for residential egress.",
        entityA: "Staircase S1",
        entityB: null,
        recommendation: "Increase staircase shaft framing to guarantee 1000mm clear egress path width. Re-align partition walls.",
      },
      {
        drawingId: drawing1.id,
        category: ConflictCategory.DISCIPLINE,
        severity: ConflictSeverity.HIGH,
        title: "Beam depth conflict with ceiling height",
        description: "Structural beam B-14 depth of 450mm drops below the finished architectural ceiling clearance level of 2400mm.",
        entityA: "Beam B-14",
        entityB: "Ceiling C-01",
        recommendation: "Request structural review to verify if beam depth can be reduced to 300mm by increasing reinforcement width, or adjust finished ceiling height.",
      },
      {
        drawingId: drawing1.id,
        category: ConflictCategory.SEMANTIC,
        severity: ConflictSeverity.MEDIUM,
        title: "Duplicate room labels 'Bedroom 2'",
        description: "Room label 'Bedroom 2' is duplicated on two separate spaces on the Ground Floor Plan layout.",
        entityA: "Room 102",
        entityB: "Room 105",
        recommendation: "Update Room 105 label to 'Guest Room' or 'Bedroom 3' to ensure unique identifier references in construction docs.",
      },
      {
        drawingId: drawing1.id,
        category: ConflictCategory.SEMANTIC,
        severity: ConflictSeverity.MEDIUM,
        title: "Missing fire exit marking",
        description: "No fire exit sign or directional path marking is annotated on the exit corridor C1 path.",
        entityA: "Corridor C1",
        entityB: null,
        recommendation: "Add standard exit signage annotation near door exit and pathway arrows according to safety standards.",
      },
      {
        drawingId: drawing1.id,
        category: ConflictCategory.SEMANTIC,
        severity: ConflictSeverity.LOW,
        title: "Missing scale annotation",
        description: "Graphic scale bar and numeric scale factor (e.g. 1:100) are missing from the drawing title block.",
        entityA: "Sheet A-101",
        entityB: null,
        recommendation: "Add a scale bar under the Ground Floor title block.",
      },
    ];

    const createdConflicts = [];
    for (const c of conflicts) {
      const dbConflict = await tx.conflict.create({ data: c });
      createdConflicts.push(dbConflict);
    }

    // Create RFIs for drawing1 linked to conflicts
    const rfiList = [
      {
        drawingId: drawing1.id,
        conflictId: createdConflicts[0].id,
        title: "Door D-04 relocation - coordination required",
        priority: "HIGH",
        discipline: "ARCHITECTURAL",
        subject: "Relocation of Door D-04 near Axis C-4",
        description: "During conflict triage, it was identified that Door D-04 radius intersects with structural wall W-12 boundary.",
        question: "Can we relocate the opening 300mm to the east, or should the door swing direction be reversed?",
        recommendation: "Relocate door 300mm east.",
        status: "GENERATED",
        conflictHash: "mock_rfi_hash_1",
      },
      {
        drawingId: drawing1.id,
        conflictId: createdConflicts[1].id,
        title: "Lintel span extension at Window W-02",
        priority: "HIGH",
        discipline: "STRUCTURAL",
        subject: "Window W-02 opening exceeds standard lintel span",
        description: "Window W-02 opening width exceeds the permissible structural lintel span limit.",
        question: "Should we design a custom lintel L-02 or reduce the architectural window width to 1200mm?",
        recommendation: "Design custom lintel reinforcement.",
        status: "GENERATED",
        conflictHash: "mock_rfi_hash_2",
      },
    ];

    for (const rfi of rfiList) {
      await tx.rfi.create({ data: rfi });
    }

    // Create a dummy drawing for Villa 302
    const drawing2 = await tx.drawing.create({
      data: {
        hash: "seed_hash_villa_302_s101",
        fileName: "S-101_Foundation_Layout.pdf",
        fileUrl: "https://res.cloudinary.com/daofwiqhx/raw/upload/v123456/S-101_Foundation_Layout.pdf",
        publicId: "drawings/S-101_Foundation_Layout",
        discipline: Discipline.STRUCTURAL,
        status: DrawingStatus.PARSED,
        documentType: "Structural Drawing",
        classificationConfidence: 0.95,
        projectName: "Villa 302",
        drawingNo: "S-101",
        revision: "Rev 0",
        parsedJson: {
          projectName: "Villa 302",
          drawingNumber: "S-101",
          discipline: "STRUCTURAL",
          spaces: [{ name: "Foundation", dimensions: "N/A" }],
        },
      } as any,
    });

    const c2 = await tx.conflict.create({
      data: {
        drawingId: drawing2.id,
        category: ConflictCategory.GEOMETRY,
        severity: ConflictSeverity.MEDIUM,
        title: "Rebar spacing out of range",
        description: "The structural model specifies rebar grid layout at 300mm centers, which contradicts foundation shear loads.",
        entityA: "Rebar Grid F-1",
        entityB: "Foundation Pad",
        recommendation: "Reduce rebar grid spacing to 150mm centers within critical load zones.",
      },
    });

    await tx.rfi.create({
      data: {
        drawingId: drawing2.id,
        conflictId: c2.id,
        title: "Rebar grid specification review",
        priority: "MEDIUM",
        discipline: "STRUCTURAL",
        subject: "Rebar spacing conflict at foundation pad",
        description: "Foundation drawing shows grid spacing at 300mm centers, while load calcs indicate 150mm is required.",
        question: "Please confirm grid spacing for critical load zones.",
        recommendation: "Change grid to 150mm centers.",
        status: "GENERATED",
        conflictHash: "mock_rfi_hash_3",
      },
    });
  });

  console.log("🌱 Database seeded successfully!");
}
