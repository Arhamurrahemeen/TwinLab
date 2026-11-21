import { Composition } from "remotion";
import { TwinLabDemoBrand } from "./brand";
import { KitPhotoPage, PFPage, TwinLabFull } from "./install";
import { TwinLabDemo } from "./TwinLabDemo";

// 57 s of scenes minus 7 x 0.5 s fades = 53.5 s
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TwinLabDemo" component={TwinLabDemo} durationInFrames={1605} fps={30} width={1920} height={1080} />
    <Composition id="TwinLabDemoBrand" component={TwinLabDemoBrand} durationInFrames={1605} fps={30} width={1920} height={1080} />
    <Composition id="TwinLabFull" component={TwinLabFull} durationInFrames={2205} fps={30} width={1920} height={1080} />
    <Composition id="PdfKitPhoto" component={KitPhotoPage} durationInFrames={210} fps={30} width={1920} height={1080} />
    <Composition id="PdfPF" component={PFPage} durationInFrames={255} fps={30} width={1920} height={1080} />
  </>
);
