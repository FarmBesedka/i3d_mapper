$(document).on('click', '.copyright', function () {
  shell.openExternal('https://vk.com/besedka_fermera')
})

$(document).on('click', '.support', function () {
  shell.openExternal('https://www.donationalerts.com/r/besedka_fermera')
})

$(document).on('click', '#fullUpdate', function () {
  if (fullUpdate) {
    fullUpdate = false
    $(this).attr('class', 'button')
  } else {
    $(this).attr('class', 'selected')
    fullUpdate = true
  }
  $('#header').attr('class', 'header')
})

$(document).on('change', '#openMod', function () {
  if ($(this)[0].files[0] !== undefined) {
    let modPath = $(this)[0].files[0].path.replace('modDesc.xml', '')
    $('#modPath').val(modPath)
    fs.readFile(modPath + 'modDesc.xml', (err, data) => {
      if (err) throw err
      $('#filesList').empty()
      let modDesc = parser.parseFromString(
        data.toString().replace('\ufeff', ''),
        'text/xml'
      )
      $(modDesc)
        .find('storeItem')
        .each(function () {
          let fileItem = $('<div/>', {
            text: $(this).attr('xmlFilename'),
            class: 'fileItem unselectedItem',
            xmlFilename: $(this).attr('xmlFilename'),
            state: false,
          })
          $('#filesList').append(fileItem)
        })
      $('#filesList').slideDown(200)
    })
  }
})

$(document).on('click', '.fileItem', function () {
  let state = $(this).attr('state')
  if (state == 'true') {
    $(this).attr('state', 'false')
    $(this).attr('class', 'fileItem unselectedItem')
  } else {
    $(this).attr('state', 'true')
    $(this).attr('class', 'fileItem selectedItem')
  }
})

$(document).on('click', '#go', function () {
  $('#header').attr('class', 'header')
  let modPath = $('#modPath').val()
  $('.fileItem').each(function () {
    if ($(this).attr('state') == 'true') {
      let fileItem = $(this)
      let xmlFile = $(this).attr('xmlFilename').replace('/', '\\')
      fs.readFile(modPath + xmlFile, (err, data) => {
        if (err) throw err
        let xmlFileData = parser.parseFromString(
          data.toString().replace('\ufeff', ''),
          'text/xml'
        )
        $(xmlFileData).find('i3dMappings').remove()
        let i3dFile =
          modPath + $(xmlFileData).find('filename').text().replace(/\//g, '\\')
        fs.readFile(i3dFile, (err, data) => {
          if (err) throw err
          let i3dFileData = parser.parseFromString(
            data.toString().replace('\ufeff', ''),
            'text/xml'
          )
          $(i3dFileData)
            .find('Scene')
            .each(function () {
              let i3dMappings = $('<i3dMappings/>', xmlFileData)
              $(this)
                .children()
                .each(function (i) {
                  if (fullUpdate) {
                    $(this).attr(
                      'name',
                      $(this)
                        .attr('name')
                        .replace(/_\d{1,}/g, '')
                        .replace(/\s/g, '')
                        .replace(/[.,]/g, '_')
                        .trim() +
                        '_' +
                        $(this).attr('nodeId')
                    )
                  }
                  let i3dMapping = $('<i3dMapping/>', xmlFileData)
                  let name = $(this).attr('name')
                  let index = i + '>'
                  i3dMapping.attr('id', name)
                  i3dMapping.attr('node', index)
                  i3dMappings.append(i3dMapping)
                  if ($(this).children().length > 0) {
                    i3dMapChild($(this), index, i3dMappings)
                  }
                })
              if (fullUpdate) {
                fs.writeFile(
                  i3dFile,
                  create(s.serializeToString(i3dFileData)).end({
                    prettyPrint: true,
                  }),
                  (err) => {
                    if (err) throw err
                  }
                )
              }
              if (fullUpdate) {
                xmlFileData = s.serializeToString(xmlFileData)
                i3dMappings.find('i3dMapping').each(function () {
                  let rep = new RegExp(
                    '"' +
                      $(this)
                        .attr('node')
                        .replace(/\|/g, '\\|')
                        .replace(/\>/g, '&gt;') +
                      '"',
                    'g'
                  )
                  xmlFileData = xmlFileData.replace(
                    rep,
                    '"' + $(this).attr('id') + '"'
                  )
                })
                xmlFileData = parser.parseFromString(xmlFileData, 'text/xml')
              }
              $(xmlFileData)
                .find('vehicle')
                .each(function () {
                  $(this).append(i3dMappings)
                })
              resolveDuplicates(i3dMappings)
              fs.writeFile(
                modPath + xmlFile,
                create(s.serializeToString(xmlFileData))
                  .end({ prettyPrint: true })
                  .replace(/&amp;gt;/g, '>'),
                (err) => {
                  if (err) throw err
                  fileItem.attr('class', 'fileItem completeItem')
                }
              )
            })
        })
      })
    }
  })
})

function i3dMapChild(node, startIndex, i3dMappings) {
  $(node)
    .children()
    .each(function (i) {
      if (fullUpdate) {
        $(this).attr(
          'name',
          $(this)
            .attr('name')
            .replace(/_\d{1,}$/g, '')
            .replace(/\s/g, '')
            .replace(/[.,]/g, '_')
            .trim() +
            '_' +
            $(this).attr('nodeId')
        )
      }
      let i3dMapping = $('<i3dMapping/>', i3dMappings)
      let name = $(this).attr('name')
      let index = startIndex + '|' + i
      i3dMapping.attr('id', name)
      i3dMapping.attr('node', index.replace('>|', '>'))
      i3dMappings.append(i3dMapping)
      if ($(this).children().length > 0) {
        i3dMapChild($(this), index, i3dMappings)
      }
    })
}

function resolveDuplicates(i3dMappings) {
  i3dMappings.find('i3dMapping').each(function (i) {
    let duplicates = i3dMappings.find(`[id='${$(this).attr('id')}']`)
    if (duplicates.length > 1) {
      duplicates.map((index, el) => {
        $(el).attr('id', `${$(el).attr('id')}_${index}`)
      })
    }
  })
}
