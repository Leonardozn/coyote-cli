function verifyVersion(version) {
  if (!version.length) return
  const numbers = version.split('.')
  
  if (numbers.length == 1) {
    if (!isNaN(numbers[0])) return numbers[0]
    return
  }

  if (numbers.length > 1) {
    if (numbers.length == 2) return
    for (const number of numbers) {
      if (isNaN(number)) return
    }

    return numbers.join('.')
  }
}

module.exports = {
  verifyVersion
}