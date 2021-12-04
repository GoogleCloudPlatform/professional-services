{
    "protocols": ["4.0", "5.1"],
    "os": "${split("_", zip.path)[2]}",
    "arch": "${replace(split("_", zip.path)[3],".zip","")}",
    "version": "${split("_", zip.path)[1]}",
    "filename": "${zip.path}",
    "download_url": "${zip.signed_url}",
    "shasums_url": "${shasums_url.signed_url}",
    "shasums_signature_url": "${shasums_sig_url.signed_url}",
    "shasum": "${filesha256(format("./.temp/%s", zip.path))}",
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