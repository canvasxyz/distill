export const sumNumbers = (values: number[]) =>
  values.reduce((v1, v2) => v1 + v2, 0);

export const pickSampleNoRepeats = <T>(inputList: T[], n: number) => {
  const inputListCopy = [...inputList];
  const output: T[] = [];
  while (output.length < n && inputListCopy.length > 0) {
    const randomIndex = Math.floor(Math.random() * inputListCopy.length);
    const [selectedTweet] = inputListCopy.splice(randomIndex, 1);
    output.push(selectedTweet);
  }
  return output;
};
