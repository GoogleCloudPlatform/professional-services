{
    "protocols": ["4.0", "5.1"],
    "os": "${split("_", zip.name)[2]}",
    "arch": "${replace(split("_", zip.name)[3],".zip","")}",
    "version": "${split("_", zip.name)[1]}",
    "filename": "${zip.name}",
    "download_url": "${zip.name}",
    "shasums_url": "${shasums_url.name}",
    "shasums_signature_url": "${shasums_sig_url.name}",
    "shasum": "${filesha256(format("./.temp/%s", zip.name))}",
    "signing_keys": {
    "gpg_public_keys": [
        {
        "key_id": "noop",
        "ascii_armor": "${replace(public_key,"\n","\\n")}",
        "trust_signature": "",
        "source": "noop",
        "source_url": "https://www.hashicorp.com/security.html"
        }
    ]
    }
}