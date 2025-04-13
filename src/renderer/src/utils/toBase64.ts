const toBase64 = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        throw new Error('toBase64 reader.result is not a string')
      }
      return resolve(reader.result)
    }
    reader.onerror = reject
  })

export default toBase64
