const { readFile, writeFile } = require('fs')
const { shell } = require('electron')
const { normalize, join, dirname, basename } = require('path')
const xml2js = require('xml2js')

const parser = new xml2js.Parser({ explicitChildren: true, preserveChildrenOrder: true })
const builder = new xml2js.Builder({
  charkey: '#',
  xmldec: { version: '1.0', encoding: 'UTF-8', standalone: false },
})

const loadMod = () => {
  if (!document.getElementById('openMod').files[0]) return false
  document.getElementById('filesList').innerHTML = ''
  let modDescPath = document.getElementById('openMod').files[0].path
  document.getElementById('modPath').value = dirname(modDescPath)
  readFile(modDescPath, (err, data) => {
    if (err) throw err
    parser.parseString(data.toString(), (err, res) => {
      if (err) throw err
      res.modDesc.storeItems[0].storeItem.forEach((el) => {
        let itemDiv = document.createElement('div')
        itemDiv.innerText = basename(el.$.xmlFilename)
        itemDiv.className = 'btn item'
        itemDiv.setAttribute('data-xmlFilename', el.$.xmlFilename)
        itemDiv.setAttribute('data-updateState', false)
        document.getElementById('filesList').append(itemDiv)
        itemDiv.addEventListener('click', (e) => {
          let updateState = e.path[0].getAttribute('data-updateState')
          if (updateState === 'false') {
            updateState = true
            e.path[0].className = 'btn item selectedItem'
          } else {
            updateState = false
            e.path[0].className = 'btn item'
          }
          e.path[0].setAttribute('data-updateState', updateState)
        })
      })
    })
  })
}

const go = () => {
  let items = document.getElementsByClassName('item')
  if (!items.length) return false
  let modPath = dirname(document.getElementById('openMod').files[0].path)
  for (let i = 0; i < items.length; i++) {
    if (items[i].getAttribute('data-updateState') === 'true') {
      let xmlPath = normalize(join(modPath, items[i].getAttribute('data-xmlFilename')))
      readFile(xmlPath, (err, xmlData) => {
        if (err) throw err
        parser.parseString(xmlData.toString(), (err, xmlRes) => {
          if (err) throw err
          let i3dPath = normalize(join(modPath, xmlRes.vehicle.base[0].filename[0]))
          readFile(i3dPath, (err, i3dData) => {
            if (err) throw err
            parser.parseString(i3dData.toString(), function (err, i3dRes) {
              if (err) throw err
              let obj = {
                i3dMappings: [],
              }
              getI3DMapping(i3dRes.i3D.Scene[0].$$, '', obj)
              obj.i3dMappings.map((el) => {
                let duplicates = []
                for (key in el) {
                  obj.i3dMappings.map((e, i) => {
                    for (k in e) {
                      if (e[k].$.id === el[key].$.id) {
                        duplicates.push([i, e[k].$.id])
                      }
                    }
                  })
                }
                if (duplicates.length > 1) {
                  duplicates.map((d, i) => {
                    obj.i3dMappings[duplicates[i][0]].i3dMapping.$.id = `${duplicates[i][1]}_${i}`
                  })
                }
              })
              // xmlRes.vehicle.i3dMappings = [obj.i3dMappings]
              console.log(xmlRes.vehicle.storeData[0].brand)
              let newXML = builder.buildObject(xmlRes.vehicle.storeData[0].brand)
              // console.log(newXML)
              // writeFile(normalize(xmlPath), newXML, (err) => {
              //   if (err) throw err
              // })
            })
          })
        })
      })
    }
  }
}

const getI3DMapping = (node, startIndex, obj) => {
  node.map((el, index) => {
    let idx = `${startIndex}|${index}`.replace(/^\|(\d{1,2})/g, '$1>').replace(/>\|/g, '>')
    obj.i3dMappings.push({
      i3dMapping: { $: { id: el.$.name, node: idx } },
    })
    if (el.$$) getI3DMapping(el.$$, idx, obj)
  })
}

const index2id = (xml, mapping) => {
  mapping.i3dMappings.map((el) => {
    xml = xml.replaceAll(`"${el.i3dMapping.$.node}"`, `"${el.i3dMapping.$.id}"`)
    console.log(xml)
  })
}

const copyright = () => {
  shell.openExternal('https://vk.com/besedka_fermera')
}
const support = () => {
  shell.openExternal('https://www.donationalerts.com/r/besedka_fermera')
}
