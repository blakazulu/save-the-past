import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PromoVideo"
      component={PromoVideo}
      durationInFrames={64 * 30} // 64 seconds at 30fps (to fit 9-second outro)
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
