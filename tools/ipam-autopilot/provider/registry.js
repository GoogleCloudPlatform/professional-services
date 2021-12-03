const fs = require('fs');
const archiver = require('archiver');
const crypto = require('crypto')

var source = process.argv[2]
var dest = process.argv[3]
var key = process.argv[4]
var binary = process.argv[5]
var version = process.argv[6]

if(fs.existsSync(dest)) {
    fs.rmSync(dest, {
        recursive: true
    })
    fs.mkdirSync(dest);
} else {
    fs.mkdirSync(dest);
}
// Start create versions file
var versions = 
{
    "versions": [
      {
        "version": version,
        "protocols": ["4.0", "5.1"],
        "platforms": [
         
        ]
      }
    ]
  };

// Stop create versions file

// ipam/ipam-autopilot
// :namespace/:type/:version/download/:os/:arch
fs.readdirSync(source).forEach(file => {
    
    var arch = file.substring(file.lastIndexOf("_")+1)
    var remaining = file.substring(0, file.lastIndexOf("_"))
    var os = remaining.substring(remaining.lastIndexOf("_")+1)
    versions.versions[0].platforms.push( {"os": os, "arch": arch} );

    var output = fs.createWriteStream(dest+file+'.zip');
    var archive = archiver('zip');
    
    output.on('close', function () {
        const shasum = crypto.createHash('sha256')
        var s = fs.ReadStream(dest+file+'.zip')
        s.on('data', function(data) {
            shasum.update(data)
        })
        
        // making digest
        s.on('end', function() {
            var entry = {
                "protocols": ["4.0", "5.1"],
                "os": os,
                "arch": arch,
                "filename": file+'.zip',
                "download_url": "/terraform/providers/v1/"+file+'.zip',
                "shasums_url": "/terraform/providers/v1/shasums",
                "shasums_signature_url": "/terraform/providers/v1/shasums.sig",
                "shasum": shasum.digest('hex'),
                "signing_keys": {
                "gpg_public_keys": [
                    {
                    "key_id": "noop",
                    "ascii_armor": fs.readFileSync(key).toString(),
                    "trust_signature": "",
                    "source": "noop",
                    "source_url": "https://www.hashicorp.com/security.html"
                    }
                ]
                }
            }

            var path = `ipam/ipam-autopilot/${version}/download/${os}/${arch}`
            fs.mkdirSync(dest+`ipam/ipam-autopilot/${version}/download/${os}`, {
                recursive: true
            })
            fs.writeFileSync(dest+path, JSON.stringify(entry));
        })
    });
    
    archive.on('error', function(err){
        throw err;
    });
    
    archive.pipe(output);
    archive.file(source+file, {
        name: file
    });
    archive.finalize();
});


fs.mkdirSync(dest+`ipam/ipam-autopilot`, {
    recursive: true
})
fs.writeFileSync(dest+`ipam/ipam-autopilot/versions`, JSON.stringify(versions));

