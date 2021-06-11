$(document).on('click', '#fullUpdate', function () {
  if (fullUpdate) {
    $('#fullUpdate').css('color', '#fea71c');
    $('#fullUpdate').css('border-color', '#fea71c');
    $('#fullUpdate').css('background-color', '#1c1c1c');
    fullUpdate = false;
  } else {
    $('#fullUpdate').css('color', '#1c1c1c');
    $('#fullUpdate').css('border-color', '#fea71c');
    $('#fullUpdate').css('background-color', '#fea71c');
    fullUpdate = true;
  }
  $('#ready').hide();
});

$(document).on('change', '#openMod', function () {
  if ($(this)[0].files[0] !== undefined) {
    $('#modPath').val($(this)[0].files[0].path.replace('modDesc.xml', ''));
  }
  $('#ready').hide();
});

$(document).on('click', '#go', function () {
  $('#ready').hide();
  let modPath = $('#modPath').val();
  fs.readFile(modPath + 'modDesc.xml', (err, data) => {
    if (err) throw err;
    let modDesc = parser.parseFromString(data.toString().replace('\ufeff', ''), 'text/xml');
    $(modDesc)
      .find('storeItem')
      .each(function () {
        let xmlFile = $(this).attr('xmlFilename').replace('/', '\\');
        fs.readFile(modPath + xmlFile, (err, data) => {
          if (err) throw err;
          let xmlFileData = parser.parseFromString(data.toString().replace('\ufeff', ''), 'text/xml');
          $(xmlFileData).find('i3dMappings').remove();
          let i3dFile = modPath + $(xmlFileData).find('filename').text().replace(/\//g, '\\');
          fs.readFile(i3dFile, (err, data) => {
            if (err) throw err;
            let i3dFileData = parser.parseFromString(data.toString().replace('\ufeff', ''), 'text/xml');
            $(i3dFileData)
              .find('Scene')
              .each(function () {
                let i3dMappings = $('<i3dMappings/>', xmlFileData);
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
                      );
                    }
                    let i3dMapping = $('<i3dMapping/>', xmlFileData);
                    let name = $(this).attr('name');
                    let index = i + '>';
                    i3dMapping.attr('id', name);
                    i3dMapping.attr('node', index);
                    i3dMappings.append(i3dMapping);
                    if ($(this).children().length > 0) {
                      i3dMapChild($(this), index, i3dMappings);
                    }
                  });
                if (fullUpdate) {
                  fs.writeFile(i3dFile, create(s.serializeToString(i3dFileData)).end({ prettyPrint: true }), (err) => {
                    if (err) throw err;
                  });
                }
                if (fullUpdate) {
                  xmlFileData = s.serializeToString(xmlFileData);
                  i3dMappings.find('i3dMapping').each(function () {
                    let rep = new RegExp('"' + $(this).attr('node').replace(/\|/g, '\\|').replace(/\>/g, '&gt;') + '"', 'g');
                    xmlFileData = xmlFileData.replace(rep, '"' + $(this).attr('id') + '"');
                  });
                  xmlFileData = parser.parseFromString(xmlFileData, 'text/xml');
                }
                $(xmlFileData)
                  .find('vehicle')
                  .each(function () {
                    $(this).append(i3dMappings);
                  });
                fs.writeFile(
                  modPath + xmlFile,
                  create(s.serializeToString(xmlFileData))
                    .end({ prettyPrint: true })
                    .replace(/&amp;gt;/g, '>'),
                  (err) => {
                    if (err) throw err;
                  }
                );
              });
          });
        });
      });
    fs.writeFile(
      modPath + 'modDesc.xml',
      create(s.serializeToString(modDesc)).end({
        prettyPrint: true,
      }),
      (err) => {
        if (err) throw err;
        $('#ready').show();
      }
    );
  });
});

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
        );
      }
      let i3dMapping = $('<i3dMapping/>', i3dMappings);
      let name = $(this).attr('name');
      let index = startIndex + '|' + i;
      i3dMapping.attr('id', name);
      i3dMapping.attr('node', index.replace('>|', '>'));
      i3dMappings.append(i3dMapping);
      if ($(this).children().length > 0) {
        i3dMapChild($(this), index, i3dMappings);
      }
    });
}
