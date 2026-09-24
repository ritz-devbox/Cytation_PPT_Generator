import { PresentationController } from "../application/controllers/PresentationController";
import { BuildSlideLayoutService } from "../application/services/BuildSlideLayoutService";
import { GeneratePresentationService } from "../application/services/GeneratePresentationService";
import { ParseImageSelectionService } from "../application/services/ParseImageSelectionService";
import { ValidateImageMatrixService } from "../application/services/ValidateImageMatrixService";
import { BrowserFileReader } from "../infrastructure/files/BrowserFileReader";
import { BrowserFileSaver } from "../infrastructure/files/BrowserFileSaver";
import type { BrowserFileSource } from "../infrastructure/files/BrowserFileSource";
import { ConsoleLogger } from "../infrastructure/logging/ConsoleLogger";
import { PptxGenJsPresentationGenerator } from "../infrastructure/presentation/PptxGenJsPresentationGenerator";
import { CircularImageBuilder } from "../infrastructure/presentation/builders/CircularImageBuilder";
import { ImageMatrixSlideBuilder } from "../infrastructure/presentation/builders/ImageMatrixSlideBuilder";
import { Sha256AccessTokenVerifier } from "../infrastructure/security/Sha256AccessTokenVerifier";

const logger = new ConsoleLogger();
const fileReader = new BrowserFileReader();
const fileSaver = new BrowserFileSaver();
const imageBuilder = new CircularImageBuilder();
const slideBuilder = new ImageMatrixSlideBuilder(imageBuilder);
const presentationGenerator = new PptxGenJsPresentationGenerator(slideBuilder);
const generatePresentationService = new GeneratePresentationService(
  presentationGenerator,
  fileSaver,
  logger,
);

export const presentationController = new PresentationController<BrowserFileSource>(
  fileReader,
  new ParseImageSelectionService(),
  new ValidateImageMatrixService(),
  new BuildSlideLayoutService(),
  generatePresentationService,
);

export const accessTokenVerifier = new Sha256AccessTokenVerifier();
