#-------------------------------------------------------------------------------
# This is not a framework | Setup script.
#
# See: https://github.com/matteocargnelutti/this-is-not-a-framework
# 2020 Matteo Cargnelutti (@matteocargnelutti)
#-------------------------------------------------------------------------------
echo "[This is mot a framework] - Setup script.";
echo "See README.md for more information.";
echo "---"

# Ask user for confirmation before cloning latest from MASTER and keeping relevant files.
read -p "Files will be copied in the current directory, continue? (y/n) " -n 1 -r
echo " "
if [[ $REPLY =~ ^[Yy]$ ]]
then
    git clone https://github.com/matteocargnelutti/this-is-not-a-framework.git # Will create a `this-is-not-a-framework` subdirectory.
    cd this-is-not-a-framework;
    mv ./src ../src;
    mv ./dist ../dist;
    mv ./*.* ../$1.$2;
    mv LICENSE ./LICENSE
    cd ..;
    rm -rf this-is-not-a-framework;
    rm setup.sh;
fi

echo "✅ Done.";
