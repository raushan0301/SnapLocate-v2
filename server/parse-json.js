import fs from 'fs'
const data = JSON.parse(fs.readFileSync('../test.json', 'utf8'))
data.content.forEach(sec => {
  (sec.modules || []).forEach(mod => {
    if(mod.name.includes("Syllabus")) {
      console.log("Found Syllabus:")
      console.log("Description:", mod.description)
      console.log("Contents:", JSON.stringify(mod.contents, null, 2))
    }
  })
})
