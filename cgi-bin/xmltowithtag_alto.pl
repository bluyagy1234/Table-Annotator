use strict;
use warnings;

&main;

sub main{
	my $xmlfile_name = '';

	if(@ARGV == 1){
		$xmlfile_name = shift @ARGV;
	}else{
		die "USAGE:make_file.pl data_file\n";
	}
	open RFH,"<$xmlfile_name" or die "there is not such file.\n";
	$xmlfile_name =~ s/.xml//g;
	open WFH,">$xmlfile_name.withtag";
		while(<RFH>){
			$_ =~ s/></>\n</g;
			$_ =~ s/<(\/*)TextBlock/\t<$1TextBlock/g;
			$_ =~ s/<(\/*)TextLine/\t\t<$1TextLine/g;
			$_ =~ s/<String/\t\t\t<String/g;
			$_ =~ s/<SP/\t\t\t<SP/g;
			#$_ =~ s/>\n<\/TOKEN>/><\/TOKEN>/g;
			#print "$_\n";
			print WFH "$_";
		}
	close WFH;
	close RFH;
}
