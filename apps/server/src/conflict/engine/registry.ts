import { ConflictRule } from "../../models/conflict.types";
import { DuplicateRoomRule } from "../semantic/duplicate-room.rule";
import { DuplicateDoorRule } from "../semantic/duplicate-door.rule";
import { DuplicateWindowRule } from "../semantic/duplicate-window.rule";
import { MissingRoomDimensionRule } from "../semantic/missing-room-dimension.rule";
import { MissingDoorWidthRule } from "../semantic/missing-door-width.rule";
import { MissingWindowSizeRule } from "../semantic/missing-window-size.rule";
import { MetadataRule } from "../semantic/metadata.rule";
import { OrphanReferenceRule } from "../semantic/orphan-reference.rule";
import { FixtureRule } from "../semantic/fixture.rule";
import { StructuralRule } from "../semantic/structural.rule";

import { WallDoorRule } from "../geometry/wall-door.rule";
import { ColumnWindowRule } from "../geometry/column-window.rule";
import { BeamColumnRule } from "../geometry/beam-column.rule";
import { BeamWallRule } from "../geometry/beam-wall.rule";
import { SlabOpeningRule } from "../geometry/slab-opening.rule";
import { RoomOverlapRule } from "../geometry/room-overlap.rule";
import { FurnitureClearanceRule } from "../geometry/furniture-clearance.rule";
import { HvacRule } from "../geometry/hvac.rule";
import { PlumbingRule } from "../geometry/plumbing.rule";
import { ElectricalRule } from "../geometry/electrical.rule";

import { ArchitectureVsStructureRule } from "../discipline/architecture-vs-structure.rule";
import { ArchitectureVsInteriorRule } from "../discipline/architecture-vs-interior.rule";
import { ArchitectureVsPlumbingRule } from "../discipline/architecture-vs-plumbing.rule";
import { ArchitectureVsElectricalRule } from "../discipline/architecture-vs-electrical.rule";

export const RULE_REGISTRY: ConflictRule[] = [
  // Semantic Rules
  new DuplicateRoomRule(),
  new DuplicateDoorRule(),
  new DuplicateWindowRule(),
  new MissingRoomDimensionRule(),
  new MissingDoorWidthRule(),
  new MissingWindowSizeRule(),
  new MetadataRule(),
  new OrphanReferenceRule(),
  new FixtureRule(),
  new StructuralRule(),

  // Geometry Rules
  new WallDoorRule(),
  new ColumnWindowRule(),
  new BeamColumnRule(),
  new BeamWallRule(),
  new SlabOpeningRule(),
  new RoomOverlapRule(),
  new FurnitureClearanceRule(),
  new HvacRule(),
  new PlumbingRule(),
  new ElectricalRule(),

  // Cross-Discipline Rules
  new ArchitectureVsStructureRule(),
  new ArchitectureVsInteriorRule(),
  new ArchitectureVsPlumbingRule(),
  new ArchitectureVsElectricalRule(),
];
