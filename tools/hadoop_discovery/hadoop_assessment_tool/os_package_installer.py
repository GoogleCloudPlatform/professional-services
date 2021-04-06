import os
import re
import sys

# initialise flags to identify packages
nload_dt, vnstat_dt, gcc_dt, odbc_dt, sasl_dt, pydevel_dt, = "", "", "", "", "", ""
# list to hold installed and non installed data
installed, not_installed = [], []
# This command will fetch os-name for ex. centos,debian,opensuse etc.
os_name = os.popen("grep PRETTY_NAME /etc/os-release").read()
os_name = os_name.lower()
final_version = ""

vs, trash, name, dt, getpython, getpython1, getpython2 = "", "", "", "", "", "", ""

final_name = ""
py_val = ""
flag = 0

py_val = os.popen(
    """python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))'"""
).read()
py_val = "".join([str(elem) for elem in py_val])
py_val = py_val.replace("\n", "")

vs = os.popen("grep VERSION_ID /etc/os-release").read()
trash, version = vs.split("=")
final_version = version.replace('"', "")
final_version = float(final_version.strip("\n"))

dt = os.popen("grep ID= /etc/os-release").read()
dt = dt.splitlines()
for i in dt:
    if re.search(r"\b" "ID" r"\b", i):
        get_name = i

trash, name = get_name.split("=")
final_name = name.replace('"', "")
final_name = final_name.strip("\n")

no_show = 0
"""
Here based on the os of the current system respective block will execute and will install packages
with their respective package managers.
"""
try:
    if "centos" in os_name and final_version >= 7:
        print("OS Dependencies Installing...")
        os.popen("pip3 install -U pip").read()
        os.popen("yum install epel-release -y").read()
        os.popen("yum install nload -y").read()
        os.popen("yum install vnstat -y").read()
        os.popen("yum install gcc gcc-c++ -y").read()
        os.popen("yum install cyrus-sasl-devel -y").read()
        os.popen("yum install unixODBC-devel -y").read()
        os.popen("yum install python3-devel -y").read()
        os.popen("yum install jq -y").read()
        nload_dt = os.popen("rpm -qa | grep nload").read()
        vnstat_dt = os.popen("rpm -qa | grep vnstat").read()
        gcc_dt = os.popen("rpm -qa | grep gcc-c++").read()
        sasl_dt = os.popen("rpm -qa | grep cyrus-sasl-devel").read()
        odbc_dt = os.popen("rpm -qa | grep unixODBC-devel").read()
        pydevel_dt = os.popen("rpm -qa | grep -e 'python\S*-dev'").read()
        venv_dt = "Venv"
    elif "ubuntu" in os_name and (final_version >= 16.04):
        print("OS Dependencies Installing...")
        if py_val == "3.8" and flag == 0:
            os.popen("apt install -y nload 2>/dev/null").read()
            os.popen("apt install -y vnstat 2>/dev/null").read()
            os.popen("apt install -y g++ 2>/dev/null").read()
            os.popen("apt install -y sasl2-bin 2>/dev/null").read()
            os.popen("apt install -y unixodbc-dev 2>/dev/null").read()
            os.popen("apt install -y python3.8-dev 2>/dev/null").read()
            os.popen("apt install -y python3.8-venv 2>/dev/null").read()
            os.popen("apt install -y libsasl2-dev 2>/dev/null").read()
            os.popen("apt install -y jq 2>/dev/null").read()
            nload_dt = os.popen("apt list --installed 2>/dev/null | grep nload").read()
            vnstat_dt = os.popen(
                "apt list --installed 2>/dev/null | grep vnstat"
            ).read()
            gcc_dt = os.popen("apt list --installed 2>/dev/null | grep g++*").read()
            sasl_dt = os.popen(
                "apt list --installed 2>/dev/null | grep sasl2-bin"
            ).read()
            odbc_dt = os.popen(
                "apt list --installed 2>/dev/null | grep unixodbc-dev"
            ).read()
            pydevel_dt = os.popen(
                "apt list --installed 2>/dev/null | grep -e 'python\S*-dev'"
            ).read()
            flag = 1
        if py_val == "3.7" and flag == 0:
            os.popen("apt install -y nload 2>/dev/null").read()
            os.popen("apt install -y vnstat 2>/dev/null").read()
            os.popen("apt install -y g++ 2>/dev/null").read()
            os.popen("apt install -y sasl2-bin 2>/dev/null").read()
            os.popen("apt install -y unixodbc-dev 2>/dev/null").read()
            os.popen("apt install -y python3.7-dev 2>/dev/null").read()
            os.popen("apt install -y python3.7-venv 2>/dev/null").read()
            os.popen("apt install -y libsasl2-dev 2>/dev/null").read()
            os.popen("apt install -y jq 2>/dev/null").read()
            nload_dt = os.popen("apt list --installed 2>/dev/null | grep nload").read()
            vnstat_dt = os.popen(
                "apt list --installed 2>/dev/null | grep vnstat"
            ).read()
            gcc_dt = os.popen("apt list --installed 2>/dev/null | grep g++-*").read()
            sasl_dt = os.popen(
                "apt list --installed 2>/dev/null | grep sasl2-bin"
            ).read()
            odbc_dt = os.popen(
                "apt list --installed 2>/dev/null | grep unixodbc-dev"
            ).read()
            pydevel_dt = os.popen(
                "apt list --installed 2>/dev/null | grep -e 'python\S*-dev'"
            ).read()
            flag = 1
        if py_val == "3.6" and flag == 0:
            os.popen("apt install -y nload 2>/dev/null").read()
            os.popen("apt install -y vnstat 2>/dev/null").read()
            os.popen("apt install -y g++ 2>/dev/null").read()
            os.popen("apt install -y sasl2-bin 2>/dev/null").read()
            os.popen("apt install -y unixodbc-dev 2>/dev/null").read()
            os.popen("apt install -y python3-dev 2>/dev/null").read()
            os.popen("apt install -y python3-venv 2>/dev/null").read()
            os.popen("apt install -y libsasl2-dev 2>/dev/null").read()
            os.popen("apt install -y jq 2>/dev/null").read()
            nload_dt = os.popen("apt list --installed 2>/dev/null | grep nload").read()
            vnstat_dt = os.popen(
                "apt list --installed 2>/dev/null | grep vnstat"
            ).read()
            gcc_dt = os.popen("apt list --installed 2>/dev/null | grep g++-*").read()
            sasl_dt = os.popen(
                "apt list --installed 2>/dev/null | grep sasl2-bin"
            ).read()
            odbc_dt = os.popen(
                "apt list --installed 2>/dev/null | grep unixodbc-dev"
            ).read()
            pydevel_dt = os.popen(
                "apt list --installed 2>/dev/null | grep -e 'python\S*-dev'"
            ).read()
            flag = 1
    elif "debian" in os_name and (final_version >= 8.9):
        print("OS Dependencies Installing...")
        if py_val >= "3.6" and flag == 0:
            os.popen("apt install -y nload 2>/dev/null").read()
            os.popen("apt install -y vnstat 2>/dev/null").read()
            os.popen("apt install -y g++ 2>/dev/null").read()
            os.popen("apt install -y sasl2-bin 2>/dev/null").read()
            os.popen("apt install -y unixodbc-dev 2>/dev/null").read()
            os.popen("apt install -y python3-dev 2>/dev/null").read()
            os.popen("apt install -y python3 python3-venv 2>/dev/null").read()
            os.popen("apt install -y virtualenv python3-virtualenv 2>/dev/null").read()
            os.popen("apt install -y libsasl2-dev 2>/dev/null").read()
            nload_dt = os.popen("apt list --installed 2>/dev/null | grep nload").read()
            vnstat_dt = os.popen(
                "apt list --installed 2>/dev/null | grep vnstat"
            ).read()
            gcc_dt = os.popen("apt list --installed 2>/dev/null | grep g++*").read()
            sasl_dt = os.popen(
                "apt list --installed 2>/dev/null | grep sasl2-bin"
            ).read()
            odbc_dt = os.popen(
                "apt list --installed 2>/dev/null | grep unixodbc-dev"
            ).read()
            pydevel_dt = os.popen(
                "apt list --installed 2>/dev/null | grep -e 'python\S*-dev'"
            ).read()
            flag = 1
    elif "red hat" in os_name and final_version >= 7:
        print("OS Dependencies Installing...")
        os.popen("yum install epel-release -y").read()
        os.popen("yum install nload -y").read()
        os.popen("yum install vnstat -y").read()
        os.popen("yum install gcc gcc-c++ -y").read()
        os.popen("yum install cyrus-sasl-devel -y").read()
        os.popen("yum install unixODBC-devel -y").read()
        os.popen("yum install python3-devel -y").read()
        os.popen("yum install jq -y").read()
        nload_dt = os.popen("rpm -qa | grep nload").read()
        vnstat_dt = os.popen("rpm -qa | grep vnstat").read()
        gcc_dt = os.popen("rpm -qa | grep gcc-c++").read()
        sasl_dt = os.popen("rpm -qa | grep cyrus-sasl-devel").read()
        odbc_dt = os.popen("rpm -qa | grep unixODBC-devel").read()
        pydevel_dt = os.popen("rpm -qa | grep -e 'python\S*-dev'").read()
    elif "suse" in os_name and final_version >= 12:
        print("OS Dependencies Installing...")
        os.popen("zypper -n install nload").read()
        os.popen("zypper -n install vnstat").read()
        os.popen("zypper -n install gcc gcc-c++").read()
        os.popen("zypper -n install cyrus-sasl-devel").read()
        os.popen("zypper -n install unixODBC-devel").read()
        os.popen("zypper -n install python3-devel").read()
        os.popen("zypper -n install jq").read()
        nload_dt = os.popen("rpm -qa | grep nload").read()
        vnstat_dt = os.popen("rpm -qa | grep vnstat").read()
        gcc_dt = os.popen("rpm -qa | grep gcc-c++").read()
        sasl_dt = os.popen("rpm -qa | grep cyrus-sasl-devel").read()
        odbc_dt = os.popen("rpm -qa | grep unixODBC-devel").read()
        pydevel_dt = os.popen("rpm -qa | grep -e 'python\S*-dev'").read()
    else:
        print("OS " + final_name + " " + final_version1 + " Not supported")
        no_show = 1
except Exception as e:
    pass
# Here Code will check if flags have been set then accordingly lists will be appened with proper data
if nload_dt != "":
    installed.append(nload_dt)
else:
    not_installed.append("Nload")
if vnstat_dt != "":
    installed.append(vnstat_dt)
else:
    not_installed.append("Vnstat")
if gcc_dt != "":
    installed.append(gcc_dt)
else:
    not_installed.append("GCC-C++")
if odbc_dt != "":
    installed.append(odbc_dt)
else:
    not_installed.append("Unix ODBC-Devel")
if sasl_dt != "":
    installed.append(sasl_dt)
else:
    not_installed.append("Cyrus SASL-Devel")
if pydevel_dt != "":
    installed.append(pydevel_dt)
else:
    not_installed.append("Python3-Devel")
installed_string = ":".join(installed)
not_installed_string = ":".join(not_installed)
# Here the code will decide based on the size of list which message to show to user about os packages installation
if no_show == 0:
    if len(installed) == 0:
        print("Installed packages :- None")
    else:
        print("Installed Packages:")
        installed_list = installed_string.split(":")
        installed_listToStr = "".join([str(elem) for elem in installed_list])
        var = ""
        dt_installed = []
        for i in installed_listToStr:
            if i != "\n":
                var = var + i
            else:
                dt_installed.append(var)
                var = ""
        counter = 1
        for i in dt_installed:
            print(counter, "-", i)
            counter = counter + 1
    if len(not_installed) == 0:
        print("Packages not Installed :- None")
    else:
        print("Packages not Installed:")
        notInstalled_list = not_installed_string.replace(":", "\n")
        notIntalled_listToStr = "".join([str(elem) for elem in notInstalled_list])
        var = ""
        dt_notInstalled = []
        for i in notIntalled_listToStr:
            if i != "\n":
                var = var + i
            else:
                dt_notInstalled.append(var)
                var = ""
        counter = 1
        for i in dt_notInstalled:
            print(counter, "-", i)
            counter = counter + 1
    if (
        "GCC-C++" in not_installed_string
        or "Unix ODBC-Devel" in not_installed_string
        or "Python3-Devel" in not_installed_string
        or "Cyrus SASL-Devel" in not_installed_string
    ):
        print("Cannot proceed as package ", not_installed_string, " not installed")
        text_file = open("hat_file.txt", "r")
        line_list = text_file.readlines()
        listToStr = " ".join([str(elem) for elem in line_list])
        os.popen("rm -rf hat_file.txt").read()
        text_file = open("hat_latest_flag.txt", "w")
        text_file.write("1")
        text_file.close()
else:
    pass
