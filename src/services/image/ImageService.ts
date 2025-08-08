
import * as ImageManipulator from 'expo-image-manipulator';

interface ImageProcessingOptions {
  width: number;
  height: number;
  compress?: number;
  format?: ImageManipulator.SaveFormat;
}

class ImageService {
  static async processImage(
    uri: string,
    options: ImageProcessingOptions
  ): Promise<ImageManipulator.ImageResult> {
    try {
      const { width, height, compress = 0.8, format = ImageManipulator.SaveFormat.PNG } = options;

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width, height } }],
        { compress, format }
      );

      return result;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }
}

export { ImageService };
