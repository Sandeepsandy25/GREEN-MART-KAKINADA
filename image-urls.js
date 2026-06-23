/**
 * Green Mart – Image URLs
 * This file provides the Cloudinary URLs for all product images.
 * The images are stored in folder "green_mart_images" on Cloudinary.
 * All images are .png format (change IMAGE_EXT if using .jpg or .webp).
 */

// Your Cloudinary base URL for the folder
const CLOUDINARY_BASE = "https://res.cloudinary.com/dahh1ibxe/image/upload/v1/green_mart_images/";
const IMAGE_EXT = ".png";  // change to ".jpg" if you upload JPGs

/**
 * Get the Cloudinary image URL for a given product ID.
 * @param {string} productId - The product ID (e.g., "amaranth_leaves")
 * @returns {string} The full URL to the image.
 */
function getProductImageUrl(productId) {
    return CLOUDINARY_BASE + productId + IMAGE_EXT;
}

/**
 * Manual mapping for any products where the filename differs from the pattern.
 * Replace the dummy URLs with your actual Cloudinary URLs.
 */
const manualImageMap = {
    // --- Leafy Greens ---
    "amaranth_leaves": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177245/amaranth_leaves_tefusp.png",
    "spinach": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1/green_mart_images/spinach.png",
    "sorrel_leaves": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177274/sorrel_leaves_tyzhmr.png",
    "fenugreek_leaves": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177248/fenugreek_leaves_rzlp5d.png",
    "roselle_leaves": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177273/roselle_leaves_rpuajl.png",
    "malabar_spinach": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177257/malabar_spinach_iqvnhl.png",
    "water_amaranth": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177284/water_amaranth_aissbt.png",
    "drumstick_leaves": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177248/drumstick_leaves_wmtlh4.png",
    "mint_leaves": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177260/mint_leaves_rl1jm1.png",
    "coriander_leaves": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177242/coriander_leaves_nzicup.png",
    "curry_leaves": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177246/curry_leaves_nkl2te.png",
    "tender_tamarind_leaves": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177280/tender_tamarind_leaves_srb34z.png",

    // --- Fresh Vegetables ---
    "green_chilli": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177252/green_chilli_wgs8am.png",
    "white_chilli": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177285/white_chilli_hcmd1a.png",
    "ginger": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177251/ginger_wcopcd.png",
    "taro_root": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177280/taro_root_glfwir.png",
    "sweet_potato": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177277/sweet_potato_p2b0mi.png",
    "cabbage": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177237/cabbage_jenbis.png",
    "ivy_gourd": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177260/ivy_gourd_e0h2hc.png",
    "brinjal": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177237/brinjal_cqwu7y.png",
    "white_brinjal": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177287/white_brinjal_tg6spd.png",
    "water_brinjal": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1/green_mart_images/water_brinjal.png",
    "okra": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177264/okra_bg7mlh.png",
    "hyacinth_beans": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177255/hyacinth_beans_moxhyb.png",
    "bitter_gourd": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177233/bitter_gourd_xylsp6.png",
    "ridge_gourd": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177276/ridge_gourd_hgibig.png",
    "ash_gourd": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177232/ash_gourd_tbvdwb.png",
    "tomato": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177283/tomato_ifkudb.png",
    "raw_banana": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177269/raw_banana_bymtgh.png",
    "raw_mango": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177273/raw_mango_h8sp93.png",
    "carrot": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177243/carrot_g21yor.png",
    "beetroot": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177234/beetroot_cxjozo.png",
    "capsicum": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177239/capsicum_yimnmn.png",
    "drumstick": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177249/drumstick_mgrgan.png",
    "yellow_cucumber": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177288/yellow_cucumber_kyr2md.png",
    "broad_beans": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177237/broad_beans_po4vjn.png",
    "spine_gourd": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1/green_mart_images/spine_gourd.png",
    "cucumber": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177245/cucumber_bu7mo7.png",
    "english_cucumber": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177250/english_cucumber_kisoax.png",
    "french_beans": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177251/french_beans_aw3drl.png",
    "stringless_beans": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177285/stringless_beans_o1riyt.png",
    "spring_onion": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177278/spring_onion_kxzkqe.png",
    "pointed_gourd": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177269/pointed_gourd_lfelrc.png",
    "onion": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177269/onion_zip4yc.png",
    "shallots": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1/green_mart_images/shallots.png",
    "sirpur_onion": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1/green_mart_images/sirpur_onion.png",
    "white_onion": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1781622709/white_onion.jpg",
    "big_garlic": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177233/big_garlic_uiiyyv.png",
    "small_garlic": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177281/small_garlic_cxvn05.png",
    "snake_gourd": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177272/snake_gourd_xn3qbi.png",
    "pumpkin": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177276/pumpkin_kucb7i.png",
    "winter_melon": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177291/winter_melon_phhozw.png",
    "cluster_beans": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177241/cluster_beans_cjnkgt.png",
    "mango_ginger": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177260/mango_ginger_ca8qwz.png",
    "hog_plum": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177258/hog_plum_imu2mk.png",
    "raw_jackfruit": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177270/raw_jackfruit_tjpax3.png",
    "green_peas": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177253/green_peas_mvq5ls.png",
    "cauliflower": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177244/cauliflower_pqlf4h.png",
    "elephant_foot_yam": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177251/elephant_foot_yam_nqrkce.png",
    "tapioca": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177288/tapioca_dedhuh.png",
    "bottle_gourd": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177239/bottle_gourd_ayivbu.png",
    "baby_corn": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177230/baby_corn_rwz0ep.png",
    "radish": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177266/radish_offxfn.png",

    // --- Fruits ---
    "lemon": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177264/lemon_w8jwjr.png",
    "lime": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177258/lime_qgnur2.png",
    "indian_gooseberry": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177255/indian_gooseberry_mxwosy.png",
    "tamarind": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177285/tamarind_z3blsf.png",
    "banana": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177237/banana_cjijso.png",
    "coconut": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177249/coconut_khquck.png",

    // --- Dairy Products ---
    "milk": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177261/milk_kvvl0o.png",
    "curd": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177245/curd_ja0brn.png",
    "paneer": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177264/paneer_pod4rh.png",

    // --- Special Items ---
    "mushroom": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177270/mushroom_ob8vm6.png",
    "banana_leaves": "https://res.cloudinary.com/dahh1ibxe/image/upload/v1782177229/banana_leaves_jrsjfk.png"
};

/**
 * Get the image URL for a product, using manual map if available.
 * @param {string} productId
 * @returns {string}
 */
function getProductImage(productId) {
    if (manualImageMap[productId]) {
        return manualImageMap[productId];
    }
    // Fallback to auto-generated URL
    return getProductImageUrl(productId);
}